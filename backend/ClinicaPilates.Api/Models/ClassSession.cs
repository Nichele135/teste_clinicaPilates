namespace ClinicaPilates.Api.Models;

public class ClassSession
{
    public int Id { get; set; }

    public int ScheduleSlotId { get; set; }
    public ScheduleSlot? ScheduleSlot { get; set; }

    // public int? InstructorId { get; set; }
    // public User? Instructor { get; set; }

    public DateTime ClassDate { get; set; }

    public DateTime StartDateTime { get; set; }

    public DateTime EndDateTime { get; set; }

    public string Status { get; set; } = "Scheduled";

    public ICollection<ClassSessionStudent> ClassSessionStudents { get; set; } = new List<ClassSessionStudent>();
}