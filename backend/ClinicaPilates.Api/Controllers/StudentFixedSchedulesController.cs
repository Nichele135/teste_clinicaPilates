using ClinicaPilates.Api.Data;
using ClinicaPilates.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaPilates.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class StudentFixedSchedulesController : ControllerBase
{
    private readonly AppDbContext _context;

    public StudentFixedSchedulesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetByStudent(int studentId)
    {
        var studentExists = await _context.Students.AnyAsync(s => s.Id == studentId);

        if (!studentExists)
        {
            return NotFound("Aluno não encontrado.");
        }

        var fixedSchedules = await _context.StudentFixedSchedules
            .Where(sfs => sfs.StudentId == studentId && sfs.IsActive)
            .Include(sfs => sfs.ScheduleSlot)
            .Select(sfs => new
            {
                sfs.Id,
                sfs.StudentId,
                sfs.ScheduleSlotId,
                sfs.IsActive,
                sfs.CreatedAt,
                DayOfWeek = sfs.ScheduleSlot.DayOfWeek,
                StartTime = sfs.ScheduleSlot.StartTime,
                EndTime = sfs.ScheduleSlot.EndTime,
                MaxStudents = sfs.ScheduleSlot.MaxStudents
            })
            .ToListAsync();

        return Ok(fixedSchedules);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] StudentFixedSchedule request)
    {
        var student = await _context.Students
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.Id == request.StudentId);

        if (student == null)
        {
            return NotFound("Aluno não encontrado.");
        }

        if (!student.IsActive)
        {
            return BadRequest("Não é possível vincular horário a um aluno inativo.");
        }

        var scheduleSlot = await _context.ScheduleSlots
            .FirstOrDefaultAsync(ss => ss.Id == request.ScheduleSlotId && ss.IsActive);

        if (scheduleSlot == null)
        {
            return NotFound("Horário não encontrado ou está inativo.");
        }

        var alreadyExists = await _context.StudentFixedSchedules
            .AnyAsync(sfs =>
                sfs.StudentId == request.StudentId &&
                sfs.ScheduleSlotId == request.ScheduleSlotId);

        if (alreadyExists)
        {
            return BadRequest("Este aluno já está vinculado a esse horário fixo.");
        }

        var activeFixedSchedulesCount = await _context.StudentFixedSchedules
            .CountAsync(sfs => sfs.StudentId == request.StudentId && sfs.IsActive);

        if (student.Plan != null && activeFixedSchedulesCount >= student.Plan.ClassesPerWeek)
        {
            return BadRequest($"O aluno já atingiu o limite de {student.Plan.ClassesPerWeek} horário(s) fixo(s) conforme o plano.");
        }

        var fixedSchedule = new StudentFixedSchedule
        {
            StudentId = request.StudentId,
            ScheduleSlotId = request.ScheduleSlotId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.StudentFixedSchedules.Add(fixedSchedule);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Horário fixo vinculado com sucesso.",
            fixedSchedule.Id,
            fixedSchedule.StudentId,
            fixedSchedule.ScheduleSlotId
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var fixedSchedule = await _context.StudentFixedSchedules
            .FirstOrDefaultAsync(sfs => sfs.Id == id);

        if (fixedSchedule == null)
        {
            return NotFound("Vínculo de horário fixo não encontrado.");
        }

        _context.StudentFixedSchedules.Remove(fixedSchedule);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Horário fixo removido com sucesso." });
    }
}