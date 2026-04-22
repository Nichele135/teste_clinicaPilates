using ClinicaPilates.Api.Data;
using ClinicaPilates.Api.DTOs.ScheduleSlotOverrides;
using ClinicaPilates.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaPilates.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ScheduleSlotsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ScheduleSlotsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ScheduleSlot>>> GetScheduleSlots()
    {
        var scheduleSlots = await _context.ScheduleSlots
            .OrderBy(s => s.DayOfWeek)
            .ThenBy(s => s.StartTime)
            .ToListAsync();

        return Ok(scheduleSlots);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ScheduleSlot>> GetScheduleSlotById(int id)
    {
        var scheduleSlot = await _context.ScheduleSlots.FindAsync(id);

        if (scheduleSlot == null)
        {
            return NotFound("Horário não encontrado.");
        }

        return Ok(scheduleSlot);
    }

    [HttpPatch("{id}/deactivate")]
    public async Task<IActionResult> DeactivateScheduleSlot(int id)
    {
        var scheduleSlot = await _context.ScheduleSlots.FindAsync(id);

        if (scheduleSlot == null)
        {
            return NotFound("Horário não encontrado.");
        }

        scheduleSlot.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok("Horário desativado com sucesso.");
    }

    [HttpPatch("{id}/activate")]
    public async Task<IActionResult> Activate(int id)
    {
        var scheduleSlot = await _context.ScheduleSlots.FindAsync(id);

        if (scheduleSlot == null)
        {
            return NotFound("Horário não encontrado.");
        }

        scheduleSlot.IsActive = true;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [AllowAnonymous]
    [HttpGet("by-date")]
    public async Task<IActionResult> GetScheduleSlotsByDate([FromQuery] DateTime date)
    {
        var targetDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var dayOfWeek = targetDate.DayOfWeek;

        var slots = await _context.ScheduleSlots
            .Where(s => s.DayOfWeek == dayOfWeek && s.IsActive)
            .OrderBy(s => s.StartTime)
            .ToListAsync();

        var overrides = await _context.ScheduleSlotOverrides
            .Where(o => o.Date.Date == targetDate.Date)
            .ToListAsync();

        var classSessions = await _context.ClassSessions
            .Include(cs => cs.ClassSessionStudents)
            .Where(cs => cs.ClassDate.Date == targetDate.Date)
            .ToListAsync();

        var result = slots.Select(slot =>
        {
            var slotOverride = overrides.FirstOrDefault(o => o.ScheduleSlotId == slot.Id);
            var classSession = classSessions.FirstOrDefault(cs => cs.ScheduleSlotId == slot.Id);

            var maxStudents = slotOverride?.MaxStudents ?? slot.MaxStudents;
            var isActive = slotOverride?.IsActive ?? true;

            var bookedStudents = classSession?.ClassSessionStudents
                .Count(css => css.Status != "Cancelled") ?? 0;

            var isAvailable = isActive && bookedStudents < maxStudents;

            return new
            {
                slot.Id,
                slot.DayOfWeek,
                slot.StartTime,
                slot.EndTime,
                MaxStudents = maxStudents,
                slot.Notes,
                IsActive = isActive,
                OverrideId = slotOverride?.Id,
                OverrideNotes = slotOverride?.Notes,
                BookedStudents = bookedStudents,
                IsAvailable = isAvailable
            };
        });

        return Ok(result);
    }

    [HttpPost("override")]
    public async Task<IActionResult> CreateOverride([FromBody] CreateScheduleSlotOverrideDto dto)
    {
        var scheduleSlot = await _context.ScheduleSlots.FindAsync(dto.ScheduleSlotId);

        if (scheduleSlot == null)
        {
            return NotFound("Horário fixo não encontrado.");
        }

        if (scheduleSlot.DayOfWeek != dto.Date.Date.DayOfWeek)
        {
            return BadRequest("A data informada não corresponde ao dia da semana do horário.");
        }

        var normalizedDate = DateTime.SpecifyKind(dto.Date.Date, DateTimeKind.Utc);

        var existing = await _context.ScheduleSlotOverrides
            .FirstOrDefaultAsync(o =>
                o.ScheduleSlotId == dto.ScheduleSlotId &&
                o.Date.Date == normalizedDate.Date);

        if (existing != null)
        {
            existing.IsActive = dto.IsActive;
            existing.MaxStudents = dto.MaxStudents;
            existing.Notes = dto.Notes;

            await _context.SaveChangesAsync();
            return Ok("Exceção atualizada com sucesso.");
        }

        var item = new ScheduleSlotOverride
        {
            ScheduleSlotId = dto.ScheduleSlotId,
            Date = normalizedDate,
            IsActive = dto.IsActive,
            MaxStudents = dto.MaxStudents,
            Notes = dto.Notes
        };

        _context.ScheduleSlotOverrides.Add(item);
        await _context.SaveChangesAsync();

        return Ok("Exceção criada com sucesso.");
    }

    [HttpPost("block-range")]
    public async Task<IActionResult> BlockRange([FromBody] BlockScheduleRangeDto dto)
    {
        if (dto.StartTime >= dto.EndTime)
        {
            return BadRequest("O horário inicial deve ser menor que o horário final.");
        }

        var targetDate = DateTime.SpecifyKind(dto.Date.Date, DateTimeKind.Utc);
        var dayOfWeek = targetDate.DayOfWeek;

        var slots = await _context.ScheduleSlots
            .Where(s => s.DayOfWeek == dayOfWeek && s.IsActive)
            .OrderBy(s => s.StartTime)
            .ToListAsync();

        if (!slots.Any())
        {
            return NotFound("Nenhum horário fixo encontrado para essa data.");
        }

        var affectedSlots = slots
            .Where(s => s.StartTime < dto.EndTime && s.EndTime > dto.StartTime)
            .ToList();

        foreach (var slot in affectedSlots)
        {
            var existing = await _context.ScheduleSlotOverrides
                .FirstOrDefaultAsync(o =>
                    o.ScheduleSlotId == slot.Id &&
                    o.Date.Date == targetDate.Date);

            if (existing != null)
            {
                existing.IsActive = false;
                existing.Notes = dto.Notes;
            }
            else
            {
                _context.ScheduleSlotOverrides.Add(new ScheduleSlotOverride
                {
                    ScheduleSlotId = slot.Id,
                    Date = targetDate,
                    IsActive = false,
                    Notes = dto.Notes
                });
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Intervalo bloqueado com sucesso.",
            totalBlocked = affectedSlots.Count
        });
    }

    [HttpPost("block-full-day")]
    public async Task<IActionResult> BlockFullDay([FromBody] BlockFullDayDto dto)
    {
        var targetDate = DateTime.SpecifyKind(dto.Date.Date, DateTimeKind.Utc);
        var dayOfWeek = targetDate.DayOfWeek;

        var slots = await _context.ScheduleSlots
            .Where(s => s.DayOfWeek == dayOfWeek && s.IsActive)
            .ToListAsync();

        if (!slots.Any())
        {
            return NotFound("Nenhum horário fixo encontrado para essa data.");
        }

        foreach (var slot in slots)
        {
            var existing = await _context.ScheduleSlotOverrides
                .FirstOrDefaultAsync(o =>
                    o.ScheduleSlotId == slot.Id &&
                    o.Date.Date == targetDate.Date);

            if (existing != null)
            {
                existing.IsActive = false;
                existing.Notes = dto.Notes;
            }
            else
            {
                _context.ScheduleSlotOverrides.Add(new ScheduleSlotOverride
                {
                    ScheduleSlotId = slot.Id,
                    Date = targetDate,
                    IsActive = false,
                    Notes = dto.Notes
                });
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Dia bloqueado com sucesso.",
            totalBlocked = slots.Count
        });
    }

    [HttpDelete("override/{overrideId}")]
    public async Task<IActionResult> RemoveOverride(int overrideId)
    {
        var item = await _context.ScheduleSlotOverrides.FindAsync(overrideId);

        if (item == null)
        {
            return NotFound("Exceção não encontrada.");
        }

        _context.ScheduleSlotOverrides.Remove(item);
        await _context.SaveChangesAsync();

        return Ok("Exceção removida com sucesso.");
    }
}