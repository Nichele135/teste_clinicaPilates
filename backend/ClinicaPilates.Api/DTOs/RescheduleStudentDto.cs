namespace ClinicaPilates.Api.DTOs;

public class RescheduleStudentDto
{
    public int StudentId { get; set; }

    public int OldClassSessionId { get; set; }

    public int NewScheduleSlotId { get; set; }

    public DateTime NewClassDate { get; set; }
}