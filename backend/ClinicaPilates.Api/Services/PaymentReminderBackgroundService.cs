using ClinicaPilates.Api.Data;
using ClinicaPilates.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ClinicaPilates.Api.Services;

public class PaymentReminderBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PaymentReminderBackgroundService> _logger;

    public PaymentReminderBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<PaymentReminderBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessReminderAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar lembretes de pagamento.");
            }

            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }

    private async Task ProcessReminderAsync()
    {
        var now = DateTime.Now;


        if (now.Day != 2)
        {
            return;
        }


        using var scope = _scopeFactory.CreateScope();

        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var monthlyPaymentService = scope.ServiceProvider.GetRequiredService<MonthlyPaymentService>();
        var emailService = scope.ServiceProvider.GetRequiredService<BrevoEmailService>();

        var month = now.Month;
        var year = now.Year;

        await monthlyPaymentService.EnsureMonthlyPaymentsExistAsync(month, year);

        var pendentes = await context.StudentPayments
            .Include(p => p.Student)
                .ThenInclude(s => s!.User)
            .Where(p =>
                p.ReferenceMonth == month &&
                p.ReferenceYear == year &&
                p.Status == "Pending" &&
                p.Student != null &&
                p.Student.IsActive &&
                p.Student.PlanId != null &&
                p.Student.User != null &&
                p.Student.User.IsActive &&
                !string.IsNullOrWhiteSpace(p.Student.User.Email))
            .ToListAsync();

        foreach (var pagamento in pendentes)
        {
            var jaEnviado = await context.PaymentReminderLogs.AnyAsync(log =>
                log.StudentPaymentId == pagamento.Id &&
                log.ReferenceMonth == month &&
                log.ReferenceYear == year);

            if (jaEnviado)
                continue;

            var aluno = pagamento.Student!;
            var email = aluno.User!.Email;

            var assunto = "Lembrete de pagamento - Clínica Pilates";

            var html = $@"
                <p>Olá, {aluno.FullName}.</p>
                <p>Este é um lembrete referente ao pagamento do seu plano deste mês.</p>
                <p><strong>Plano:</strong> {pagamento.PlanName}</p>
                <p><strong>Valor:</strong> R$ {pagamento.PlanPrice:F2}</p>
                <p>Em caso de dúvida, entre em contato com a clínica.</p>
                <p>Clínica Pilates</p>
            ";

            await emailService.SendEmailAsync(
                email,
                aluno.FullName,
                assunto,
                html
            );

            context.PaymentReminderLogs.Add(new PaymentReminderLog
            {
                StudentPaymentId = pagamento.Id,
                ReferenceMonth = month,
                ReferenceYear = year,
                Email = email,
                SentAt = DateTime.UtcNow
            });
        }

        await context.SaveChangesAsync();
    }
}