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
public class StudentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public StudentsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
public async Task<ActionResult<IEnumerable<StudentResponseDto>>> GetStudents()
{
    var students = await _context.Students
        .OrderBy(student => student.Id)
        .Select(student => new StudentResponseDto
        {
            Id = student.Id,
            FullName = student.FullName,
            Phone = student.Phone,
            Email = student.Email,
            BirthDate = student.BirthDate,
            StartDate = student.StartDate,
            IsActive = student.IsActive,
            Notes = student.Notes,
            PlanId = student.PlanId,
            PlanName = student.Plan != null ? student.Plan.Name : string.Empty,
            PlanPeriodicity = student.Plan != null ? student.Plan.Periodicity : string.Empty,
            ClassesPerWeek = student.Plan != null ? student.Plan.ClassesPerWeek : null,
            PlanPrice = student.Plan != null ? student.Plan.Price : null
        })
        .ToListAsync();

    return Ok(students);
}

[HttpGet("{id}")]
public async Task<ActionResult<StudentResponseDto>> GetStudentById(int id)
{
    var student = await _context.Students
        .Include(s => s.Plan)
        .Where(s => s.Id == id)
        .Select(s => new StudentResponseDto
        {
            Id = s.Id,
            FullName = s.FullName,
            Phone = s.Phone,
            Email = s.Email,
            BirthDate = s.BirthDate,
            StartDate = s.StartDate,
            IsActive = s.IsActive,
            Notes = s.Notes,
            PlanId = s.PlanId,
            PlanName = s.Plan != null ? s.Plan.Name : string.Empty,
            PlanPeriodicity = s.Plan != null ? s.Plan.Periodicity : string.Empty,
            ClassesPerWeek = s.Plan != null ? s.Plan.ClassesPerWeek : null,
            PlanPrice = s.Plan != null ? s.Plan.Price : null
        })
        .FirstOrDefaultAsync();

    if (student == null)
    {
        return NotFound("Aluno não encontrado.");
    }

    return Ok(student);
}


[HttpPut("{id}")]
public async Task<IActionResult> UpdateStudent(int id, CreateStudentDto dto)
{
    var student = await _context.Students.FindAsync(id);

    if (student == null)
    {
        return NotFound("Aluno não encontrado.");
    }

    student.FullName = dto.FullName;
    student.Phone = dto.Phone;
    student.Email = dto.Email;
    student.BirthDate = dto.BirthDate.HasValue
        ? dto.BirthDate.Value.Date
        : null;
    student.Notes = dto.Notes;

    await _context.SaveChangesAsync();

    return Ok("Aluno atualizado com sucesso.");
}

    [HttpPatch("{id}/deactivate")]
public async Task<IActionResult> DeactivateStudent(int id)
{
    var student = await _context.Students.FindAsync(id);

    if (student == null)
    {
        return NotFound("Aluno não encontrado.");
    }

    student.IsActive = false;

    await _context.SaveChangesAsync();

    return Ok("Aluno desativado com sucesso.");
}

    [HttpPatch("{id}/reactivate")]
    public async Task<IActionResult> ReactivateStudent(int id)
    {
        var student = await _context.Students.FindAsync(id);

        if (student == null)
        {
            return NotFound("Aluno não encontrado.");
        }

        student.IsActive = true;

        await _context.SaveChangesAsync();

        return Ok("Aluno reativado com sucesso.");
    }

[HttpPost]
public async Task<ActionResult<Student>> CreateStudent(CreateStudentDto dto)
{
    var student = new Student
    {
        FullName = dto.FullName,
        Phone = dto.Phone,
        Email = dto.Email,
        BirthDate = dto.BirthDate.HasValue
            ? DateTime.SpecifyKind(dto.BirthDate.Value, DateTimeKind.Utc)
            : null,
        Notes = dto.Notes
    };

    _context.Students.Add(student);
    await _context.SaveChangesAsync();

    return CreatedAtAction(nameof(GetStudentById), new { id = student.Id }, student);
}

[HttpPatch("{id}/assign-plan")]
public async Task<IActionResult> AssignPlanToStudent(int id, [FromBody] AssignPlanDto dto)
{
    var student = await _context.Students
        .Include(s => s.Plan)
        .FirstOrDefaultAsync(s => s.Id == id);

    if (student == null)
    {
        return NotFound("Aluno não encontrado.");
    }

    var plan = await _context.Plans
        .FirstOrDefaultAsync(p => p.Id == dto.PlanId && p.IsActive);

    if (plan == null)
    {
        return NotFound("Plano não encontrado ou está inativo.");
    }

    student.PlanId = plan.Id;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Plano vinculado ao aluno com sucesso.",
        studentId = student.Id,
        studentName = student.FullName,
        planId = plan.Id,
        planName = plan.Name,
        periodicity = plan.Periodicity,
        classesPerWeek = plan.ClassesPerWeek,
        price = plan.Price
    });
}
}