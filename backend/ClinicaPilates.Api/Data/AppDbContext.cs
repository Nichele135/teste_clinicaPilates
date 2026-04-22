using ClinicaPilates.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ClinicaPilates.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<ScheduleSlot> ScheduleSlots { get; set; }
    public DbSet<ClassSession> ClassSessions { get; set; }
    public DbSet<ClassSessionStudent> ClassSessionStudents { get; set; }
    public DbSet<Plan> Plans { get; set; }
    public DbSet<StudentPayment> StudentPayments { get; set; }
    public DbSet<ScheduleSlotOverride> ScheduleSlotOverrides { get; set; }
    public DbSet<PaymentReminderLog> PaymentReminderLogs { get; set; }
    public DbSet<StudentFixedSchedule> StudentFixedSchedules { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ClassSessionStudent>()
            .HasKey(css => new { css.ClassSessionId, css.StudentId });

        modelBuilder.Entity<ClassSessionStudent>()
            .HasOne(css => css.ClassSession)
            .WithMany(cs => cs.ClassSessionStudents)
            .HasForeignKey(css => css.ClassSessionId);

        modelBuilder.Entity<ClassSessionStudent>()
            .HasOne(css => css.Student)
            .WithMany(s => s.ClassSessionStudents)
            .HasForeignKey(css => css.StudentId);

        modelBuilder.Entity<ClassSession>()
            .HasOne(cs => cs.ScheduleSlot)
            .WithMany(ss => ss.ClassSessions)
            .HasForeignKey(cs => cs.ScheduleSlotId);

        modelBuilder.Entity<ScheduleSlotOverride>()
            .HasOne(o => o.ScheduleSlot)
            .WithMany(s => s.Overrides)
            .HasForeignKey(o => o.ScheduleSlotId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ScheduleSlotOverride>()
            .HasIndex(o => new { o.ScheduleSlotId, o.Date })
            .IsUnique();

        modelBuilder.Entity<Student>()
            .HasOne(s => s.Plan)
            .WithMany(p => p.Students)
            .HasForeignKey(s => s.PlanId)
            .OnDelete(DeleteBehavior.SetNull);

        // Configurações para PaymentReminderLog
        modelBuilder.Entity<PaymentReminderLog>()
            .HasOne(r => r.StudentPayment)
            .WithMany()
            .HasForeignKey(r => r.StudentPaymentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PaymentReminderLog>()
            .HasIndex(r => new { r.StudentPaymentId, r.ReferenceMonth, r.ReferenceYear })
            .IsUnique();

        // Configurações para Student e User
        modelBuilder.Entity<Student>()
            .HasOne(s => s.User)
            .WithOne(u => u.Student)
            .HasForeignKey<Student>(s => s.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Student>()
            .HasIndex(s => s.Email)
            .IsUnique();

        modelBuilder.Entity<StudentPayment>()
            .HasOne(sp => sp.Student)
            .WithMany(s => s.Payments)
            .HasForeignKey(sp => sp.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<StudentPayment>()
            .Property(sp => sp.PlanPrice)
            .HasColumnType("decimal(10,2)");

        modelBuilder.Entity<StudentPayment>()
            .HasIndex(sp => new { sp.StudentId, sp.ReferenceMonth, sp.ReferenceYear })
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<StudentFixedSchedule>()
            .HasOne(sfs => sfs.Student)
            .WithMany()
            .HasForeignKey(sfs => sfs.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<StudentFixedSchedule>()
            .HasOne(sfs => sfs.ScheduleSlot)
            .WithMany()
            .HasForeignKey(sfs => sfs.ScheduleSlotId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<StudentFixedSchedule>()
            .HasIndex(sfs => new { sfs.StudentId, sfs.ScheduleSlotId })
            .IsUnique();

        modelBuilder.Entity<Plan>().HasData(
            new Plan { Id = 1, Name = "1x por semana", Periodicity = "Mensal", ClassesPerWeek = 1, Price = 210m, IsActive = true },
            new Plan { Id = 2, Name = "2x por semana", Periodicity = "Mensal", ClassesPerWeek = 2, Price = 350m, IsActive = true },
            new Plan { Id = 3, Name = "3x por semana", Periodicity = "Mensal", ClassesPerWeek = 3, Price = 430m, IsActive = true },

            new Plan { Id = 4, Name = "1x por semana", Periodicity = "Semestral - Recorrente", ClassesPerWeek = 1, Price = 180m, IsActive = true },
            new Plan { Id = 5, Name = "2x por semana", Periodicity = "Semestral - Recorrente", ClassesPerWeek = 2, Price = 300m, IsActive = true },
            new Plan { Id = 6, Name = "3x por semana", Periodicity = "Semestral - Recorrente", ClassesPerWeek = 3, Price = 390m, IsActive = true },

            new Plan { Id = 7, Name = "1x por semana", Periodicity = "Anual - Recorrente", ClassesPerWeek = 1, Price = 170m, IsActive = true },
            new Plan { Id = 8, Name = "2x por semana", Periodicity = "Anual - Recorrente", ClassesPerWeek = 2, Price = 285m, IsActive = true },
            new Plan { Id = 9, Name = "3x por semana", Periodicity = "Anual - Recorrente", ClassesPerWeek = 3, Price = 370m, IsActive = true }
        );
    }
}