using System;

namespace ClinicaPilates.Api.Models;

public class StudentFixedSchedule
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public Student Student { get; set; }

    public int ScheduleSlotId { get; set; }
    public ScheduleSlot ScheduleSlot { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}