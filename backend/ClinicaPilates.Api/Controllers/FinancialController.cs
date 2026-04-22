using ClinicaPilates.Api.Data;
using ClinicaPilates.Api.DTOs.Financial;
using ClinicaPilates.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClinicaPilates.Api.Services;

namespace ClinicaPilates.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FinancialController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly MonthlyPaymentService _monthlyPaymentService;

    public FinancialController(AppDbContext context, MonthlyPaymentService monthlyPaymentService)
        {
        _context = context;
        _monthlyPaymentService = monthlyPaymentService;
        }

    [HttpGet("monthly-status")]
    public async Task<ActionResult<IEnumerable<MonthlyPaymentResponseDto>>> GetMonthlyStatus(
        [FromQuery] int month,
        [FromQuery] int year)
    {
        if (month < 1 || month > 12)
            return BadRequest("Mês inválido.");

        if (year < 2000 || year > 2100)
            return BadRequest("Ano inválido.");

        await _monthlyPaymentService.EnsureMonthlyPaymentsExistAsync(month, year);

        var payments = await _context.StudentPayments
            .Include(p => p.Student)
            .Where(p => p.ReferenceMonth == month && p.ReferenceYear == year)
            .OrderBy(p => p.Status == "Paid")
            .ThenBy(p => p.Student!.FullName)
            .Select(p => new MonthlyPaymentResponseDto
            {
                PaymentId = p.Id,
                StudentId = p.StudentId,
                StudentName = p.Student!.FullName,
                StudentPhone = p.Student.Phone,
                ReferenceMonth = p.ReferenceMonth,
                ReferenceYear = p.ReferenceYear,
                PlanName = p.PlanName,
                PlanPrice = p.PlanPrice,
                Status = p.Status,
                PaidAt = p.PaidAt,
                Notes = p.Notes
            })
            .ToListAsync();

        return Ok(payments);
    }

    [HttpPatch("{paymentId}/pay")]
    public async Task<IActionResult> MarkAsPaid(int paymentId, [FromBody] MarkPaymentDto? dto)
    {
        var payment = await _context.StudentPayments.FindAsync(paymentId);

        if (payment == null)
            return NotFound("Registro financeiro não encontrado.");

        payment.Status = "Paid";
        payment.PaidAt = DateTime.UtcNow;
        payment.Notes = dto?.Notes;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Pagamento marcado como pago com sucesso." });
    }

    [HttpPatch("{paymentId}/undo")]
    public async Task<IActionResult> UndoPayment(int paymentId)
    {
        var payment = await _context.StudentPayments.FindAsync(paymentId);

        if (payment == null)
            return NotFound("Registro financeiro não encontrado.");

        payment.Status = "Pending";
        payment.PaidAt = null;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Pagamento revertido para pendente com sucesso." });
    }

    [HttpGet("student/{studentId}/history")]
    public async Task<ActionResult<IEnumerable<StudentPaymentHistoryDto>>> GetStudentHistory(int studentId)
    {
        var studentExists = await _context.Students.AnyAsync(s => s.Id == studentId);

        if (!studentExists)
            return NotFound("Aluno não encontrado.");

        var history = await _context.StudentPayments
            .Where(p => p.StudentId == studentId)
            .OrderByDescending(p => p.ReferenceYear)
            .ThenByDescending(p => p.ReferenceMonth)
            .Select(p => new StudentPaymentHistoryDto
            {
                PaymentId = p.Id,
                ReferenceMonth = p.ReferenceMonth,
                ReferenceYear = p.ReferenceYear,
                PlanName = p.PlanName,
                PlanPrice = p.PlanPrice,
                Status = p.Status,
                PaidAt = p.PaidAt,
                Notes = p.Notes
            })
            .ToListAsync();

        return Ok(history);
    }

}