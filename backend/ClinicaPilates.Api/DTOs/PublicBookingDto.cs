namespace ClinicaPilates.Api.DTOs;

public class PublicBookingDto
{
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int ScheduleSlotId { get; set; }
    public DateTime ClassDate { get; set; }
}