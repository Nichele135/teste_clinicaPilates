using ClinicaPilates.Api.Data;
using ClinicaPilates.Api.DTOs;
using ClinicaPilates.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaPilates.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ScheduleSlotOverridesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ScheduleSlotOverridesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("by-date")]
    public async Task<ActionResult<IEnumerable<ScheduleSlotOverrideResponseDto>>> GetByDate([FromQuery] DateTime date)
    {
        var targetDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);

        var overrides = await _context.ScheduleSlotOverrides
            .Where(o => o.Date.Date == targetDate)
            .OrderBy(o => o.ScheduleSlotId)
            .Select(o => new ScheduleSlotOverrideResponseDto
            {
                Id = o.Id,
                ScheduleSlotId = o.ScheduleSlotId,
                Date = o.Date,
                IsActive = o.IsActive,
                MaxStudents = o.MaxStudents ?? 0, // 🔥 correção
                Notes = o.Notes
            })
            .ToListAsync();

        return Ok(overrides);
    }

    [HttpPost]
    public async Task<ActionResult<ScheduleSlotOverrideResponseDto>> Create([FromBody] ScheduleSlotOverrideDto dto)
    {
        if (dto.MaxStudents < 1 || dto.MaxStudents > 5)
        {
            return BadRequest("O máximo de alunos deve ser entre 1 e 5.");
        }

        var scheduleSlot = await _context.ScheduleSlots
            .FirstOrDefaultAsync(s => s.Id == dto.ScheduleSlotId);

        if (scheduleSlot == null)
        {
            return NotFound("Horário base não encontrado.");
        }

        var targetDate = DateTime.SpecifyKind(dto.Date.Date, DateTimeKind.Utc);

        if (scheduleSlot.DayOfWeek != targetDate.DayOfWeek)
        {
            return BadRequest("A data informada não corresponde ao dia da semana do horário fixo.");
        }

        var existingOverride = await _context.ScheduleSlotOverrides
            .FirstOrDefaultAsync(o =>
                o.ScheduleSlotId == dto.ScheduleSlotId &&
                o.Date.Date == targetDate.Date);

        if (existingOverride != null)
        {
            return BadRequest("Já existe um ajuste para este horário nesta data.");
        }

        var scheduleSlotOverride = new ScheduleSlotOverride
        {
            ScheduleSlotId = dto.ScheduleSlotId,
            Date = targetDate,
            IsActive = dto.IsActive,
            MaxStudents = dto.MaxStudents,
            Notes = dto.Notes
        };

        _context.ScheduleSlotOverrides.Add(scheduleSlotOverride);
        await _context.SaveChangesAsync();

        var response = new ScheduleSlotOverrideResponseDto
        {
            Id = scheduleSlotOverride.Id,
            ScheduleSlotId = scheduleSlotOverride.ScheduleSlotId,
            Date = scheduleSlotOverride.Date,
            IsActive = scheduleSlotOverride.IsActive,
            MaxStudents = scheduleSlotOverride.MaxStudents ?? 0, // 🔥 correção
            Notes = scheduleSlotOverride.Notes
        };

        return CreatedAtAction(nameof(GetByDate), new { date = response.Date.ToString("yyyy-MM-dd") }, response);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ScheduleSlotOverrideResponseDto>> Update(int id, [FromBody] UpdateScheduleSlotOverrideDto dto)
    {
        if (dto.MaxStudents < 1 || dto.MaxStudents > 5)
        {
            return BadRequest("O máximo de alunos deve ser entre 1 e 5.");
        }

        var scheduleSlotOverride = await _context.ScheduleSlotOverrides
            .FirstOrDefaultAsync(o => o.Id == id);

        if (scheduleSlotOverride == null)
        {
            return NotFound("Ajuste de horário não encontrado.");
        }

        scheduleSlotOverride.IsActive = dto.IsActive;
        scheduleSlotOverride.MaxStudents = dto.MaxStudents;
        scheduleSlotOverride.Notes = dto.Notes;

        await _context.SaveChangesAsync();

        var response = new ScheduleSlotOverrideResponseDto
        {
            Id = scheduleSlotOverride.Id,
            ScheduleSlotId = scheduleSlotOverride.ScheduleSlotId,
            Date = scheduleSlotOverride.Date,
            IsActive = scheduleSlotOverride.IsActive,
            MaxStudents = scheduleSlotOverride.MaxStudents ?? 0, // 🔥 correção
            Notes = scheduleSlotOverride.Notes
        };

        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var scheduleSlotOverride = await _context.ScheduleSlotOverrides
            .FirstOrDefaultAsync(o => o.Id == id);

        if (scheduleSlotOverride == null)
        {
            return NotFound("Ajuste de horário não encontrado.");
        }

        _context.ScheduleSlotOverrides.Remove(scheduleSlotOverride);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}