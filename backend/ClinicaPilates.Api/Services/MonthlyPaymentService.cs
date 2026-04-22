using ClinicaPilates.Api.Data;
using ClinicaPilates.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ClinicaPilates.Api.Services;

public class MonthlyPaymentService
{
    private readonly AppDbContext _context;

    public MonthlyPaymentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task EnsureMonthlyPaymentsExistAsync(int month, int year)
    {
        var studentsWithPlan = await _context.Students
            .Include(s => s.Plan)
            .Where(s => s.IsActive && s.PlanId != null && s.Plan != null)
            .ToListAsync();

        foreach (var student in studentsWithPlan)
        {
            var alreadyExists = await _context.StudentPayments.AnyAsync(p =>
                p.StudentId == student.Id &&
                p.ReferenceMonth == month &&
                p.ReferenceYear == year);

            if (alreadyExists)
                continue;

            _context.StudentPayments.Add(new StudentPayment
            {
                StudentId = student.Id,
                ReferenceMonth = month,
                ReferenceYear = year,
                PlanName = $"{student.Plan!.Name} - {student.Plan.Periodicity}",
                PlanPrice = student.Plan.Price,
                Status = "Pending",
                PaidAt = null,
                Notes = null
            });
        }

        await _context.SaveChangesAsync();
    }
}