using ClinicaPilates.Api.Data;
using ClinicaPilates.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ClinicaPilates.Api.Services;

public static class DefaultScheduleInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        // Se já existir, não cria de novo
        if (await context.ScheduleSlots.AnyAsync())
            return;

        var dias = new[]
        {
            DayOfWeek.Monday,
            DayOfWeek.Tuesday,
            DayOfWeek.Wednesday,
            DayOfWeek.Thursday,
            DayOfWeek.Friday
        };

        var inicio = new TimeSpan(8, 0, 0);
        var fim = new TimeSpan(20, 0, 0);

        var duracao = TimeSpan.FromMinutes(50);
        var intervalo = TimeSpan.FromMinutes(10);

        var lista = new List<ScheduleSlot>();

        foreach (var dia in dias)
        {
            var atual = inicio;

            while (atual + duracao <= fim)
            {
                var final = atual + duracao;

                int max = atual >= new TimeSpan(16, 0, 0) ? 5 : 4;

                lista.Add(new ScheduleSlot
                {
                    DayOfWeek = dia,
                    StartTime = atual,
                    EndTime = final,
                    MaxStudents = max,
                    IsActive = true,
                    Notes = "Gerado automaticamente"
                });

                atual = final + intervalo;
            }
        }

        context.ScheduleSlots.AddRange(lista);
        await context.SaveChangesAsync();
    }
}