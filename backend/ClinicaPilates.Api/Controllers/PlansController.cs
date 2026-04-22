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
public class PlansController : ControllerBase
{
    private readonly AppDbContext _context;

    public PlansController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PlanResponseDto>>> GetPlans()
    {
        var plans = await _context.Plans
            .OrderBy(p => p.Id)
            .Select(p => new PlanResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Periodicity = p.Periodicity,
                ClassesPerWeek = p.ClassesPerWeek,
                Price = p.Price,
                IsActive = p.IsActive
            })
            .ToListAsync();

        return Ok(plans);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PlanResponseDto>> GetPlanById(int id)
    {
        var plan = await _context.Plans
            .Where(p => p.Id == id)
            .Select(p => new PlanResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Periodicity = p.Periodicity,
                ClassesPerWeek = p.ClassesPerWeek,
                Price = p.Price,
                IsActive = p.IsActive
            })
            .FirstOrDefaultAsync();

        if (plan == null)
        {
            return NotFound("Plano não encontrado.");
        }

        return Ok(plan);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePlan(CreatePlanDto dto)
    {
        var plan = new Plan
        {
            Name = dto.Name,
            Periodicity = dto.Periodicity,
            ClassesPerWeek = dto.ClassesPerWeek,
            Price = dto.Price,
            IsActive = true
        };

        _context.Plans.Add(plan);
        await _context.SaveChangesAsync();

        return Ok("Plano criado com sucesso.");
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePlan(int id, CreatePlanDto dto)
    {
        var plan = await _context.Plans.FindAsync(id);

        if (plan == null)
        {
            return NotFound("Plano não encontrado.");
        }

        plan.Name = dto.Name;
        plan.Periodicity = dto.Periodicity;
        plan.ClassesPerWeek = dto.ClassesPerWeek;
        plan.Price = dto.Price;

        await _context.SaveChangesAsync();

        return Ok("Plano atualizado com sucesso.");
    }

    [HttpPatch("{id}/deactivate")]
    public async Task<IActionResult> DeactivatePlan(int id)
    {
        var plan = await _context.Plans.FindAsync(id);

        if (plan == null)
        {
            return NotFound("Plano não encontrado.");
        }

        plan.IsActive = false;

        await _context.SaveChangesAsync();

        return Ok("Plano desativado com sucesso.");
    }

    [HttpPatch("{id}/activate")]
    public async Task<IActionResult> ActivatePlan(int id)
    {
        var plan = await _context.Plans.FindAsync(id);

        if (plan == null)
        {
            return NotFound("Plano não encontrado.");
        }

        plan.IsActive = true;

        await _context.SaveChangesAsync();

        return Ok("Plano reativado com sucesso.");
    }
}