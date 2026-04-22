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
public class ClassSessionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly BrevoEmailService _emailService;

    public ClassSessionsController(AppDbContext context, BrevoEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    // LISTAR AULAS COM INFORMAÇÕES DE ALUNOS E STATUS DE CRÉDITO PARA REPOSIÇÃO
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClassSessionResponseDto>>> GetClassSessions()
    {
        var classSessions = await _context.ClassSessions
            .Include(cs => cs.ScheduleSlot)
            .Include(cs => cs.ClassSessionStudents)
                .ThenInclude(css => css.Student)
            .Select(cs => new ClassSessionResponseDto
            {
                Id = cs.Id,
                ScheduleSlotId = cs.ScheduleSlotId,
                DayOfWeek = cs.ScheduleSlot != null ? cs.ScheduleSlot.DayOfWeek.ToString() : string.Empty,
                StartTime = cs.ScheduleSlot != null ? cs.ScheduleSlot.StartTime.ToString() : string.Empty,
                EndTime = cs.ScheduleSlot != null ? cs.ScheduleSlot.EndTime.ToString() : string.Empty,
                ClassDate = cs.ClassDate,
                StartDateTime = cs.StartDateTime,
                EndDateTime = cs.EndDateTime,
                Status = cs.Status,
                TotalStudents = cs.ClassSessionStudents.Count,
                Students = cs.ClassSessionStudents
                    .Where(css => css.Student != null)
                    .Select(css => new StudentInClassDto
                    {
                        Id = css.Student!.Id,
                        FullName = css.Student.FullName,
                        Phone = css.Student.Phone,
                        Status = css.Status,
                        HasMakeupCredit = css.Status == "Cancelled"
                            ? (css.HasMakeupCredit
                                ? "Tem direito a crédito"
                                : "Não tem direito a crédito")
                            : "Não se aplica",
                        EquipmentUsed = css.EquipmentUsed,
                        EquipmentNotes = css.EquipmentNotes
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(classSessions);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ClassSessionResponseDto>> GetClassSessionById(int id)
    {
        var classSession = await _context.ClassSessions
            .Include(cs => cs.ScheduleSlot)
            .Include(cs => cs.ClassSessionStudents)
                .ThenInclude(css => css.Student)
            .FirstOrDefaultAsync(cs => cs.Id == id);

        if (classSession == null)
        {
            return NotFound("Aula não encontrada.");
        }

        var response = new ClassSessionResponseDto
        {
            Id = classSession.Id,
            ScheduleSlotId = classSession.ScheduleSlotId,
            DayOfWeek = classSession.ScheduleSlot != null ? classSession.ScheduleSlot.DayOfWeek.ToString() : string.Empty,
            StartTime = classSession.ScheduleSlot != null ? classSession.ScheduleSlot.StartTime.ToString() : string.Empty,
            EndTime = classSession.ScheduleSlot != null ? classSession.ScheduleSlot.EndTime.ToString() : string.Empty,
            ClassDate = classSession.ClassDate,
            StartDateTime = classSession.StartDateTime,
            EndDateTime = classSession.EndDateTime,
            Status = classSession.Status,
            TotalStudents = classSession.ClassSessionStudents.Count,
            Students = classSession.ClassSessionStudents
                .Where(css => css.Student != null)
                .Select(css => new StudentInClassDto
                {
                    Id = css.Student!.Id,
                    FullName = css.Student.FullName,
                    Phone = css.Student.Phone,
                    Status = css.Status,
                    HasMakeupCredit = css.Status == "Cancelled"
                        ? (css.HasMakeupCredit
                            ? "Tem direito a crédito"
                            : "Não tem direito a crédito")
                        : "Não se aplica",
                    EquipmentUsed = css.EquipmentUsed,
                    EquipmentNotes = css.EquipmentNotes
                })
                .ToList()
        };

        return Ok(response);
    }

    // CANCELAR AULA
    [HttpPatch("{id}/cancel")]
    public async Task<IActionResult> CancelClassSession(int id)
    {
        var classSession = await _context.ClassSessions.FindAsync(id);

        if (classSession == null)
        {
            return NotFound("Aula não encontrada.");
        }

        classSession.Status = "Cancelled";

        await _context.SaveChangesAsync();

        return Ok("Aula cancelada com sucesso.");
    }

    [HttpPost]
    public async Task<ActionResult<ClassSession>> CreateClassSession(CreateClassSessionDto dto)
    {
        var scheduleSlot = await _context.ScheduleSlots.FindAsync(dto.ScheduleSlotId);

        if (scheduleSlot == null)
        {
            return BadRequest("Horário não encontrado.");
        }

        var classSession = new ClassSession
        {
            ScheduleSlotId = dto.ScheduleSlotId,
            ClassDate = DateTime.SpecifyKind(dto.ClassDate, DateTimeKind.Utc),
            StartDateTime = DateTime.SpecifyKind(dto.StartDateTime, DateTimeKind.Utc),
            EndDateTime = DateTime.SpecifyKind(dto.EndDateTime, DateTimeKind.Utc),
            Status = "Scheduled"
        };

        _context.ClassSessions.Add(classSession);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetClassSessions), new { id = classSession.Id }, classSession);
    }

    [HttpPost("{id}/book")]
    public async Task<IActionResult> BookStudent(int id, BookStudentDto dto)
    {
        if (id != dto.ClassSessionId)
        {
            return BadRequest("Id da aula inválido.");
        }

        var classSession = await _context.ClassSessions
            .Include(cs => cs.ScheduleSlot)
            .Include(cs => cs.ClassSessionStudents)
            .FirstOrDefaultAsync(cs => cs.Id == dto.ClassSessionId);

        if (classSession == null)
        {
            return NotFound("Aula não encontrada.");
        }

        var student = await _context.Students
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.Id == dto.StudentId);

        if (student == null)
        {
            return NotFound("Aluno não encontrado.");
        }

        if (!student.IsActive)
        {
            return BadRequest("Aluno desativado.");
        }

        if (student.Plan == null)
        {
            return BadRequest("O aluno não possui plano vinculado.");
        }

        if (classSession.ScheduleSlot == null)
        {
            return BadRequest("Horário da aula não encontrado.");
        }

        var classDate = classSession.ClassDate.Date;

        var startOfWeek = classDate.DayOfWeek == DayOfWeek.Sunday
            ? classDate.AddDays(-6)
            : classDate.AddDays(-(int)classDate.DayOfWeek + 1);

        var endOfWeek = startOfWeek.AddDays(6);

        var jaTemAulaNoMesmoDia = await _context.ClassSessionStudents
            .Include(css => css.ClassSession)
            .AnyAsync(css =>
                css.StudentId == dto.StudentId &&
                css.ClassSession != null &&
                css.ClassSession.ClassDate.Date == classDate &&
                css.Status == "Booked");

        if (jaTemAulaNoMesmoDia)
        {
            return BadRequest("O aluno já possui uma aula agendada neste dia.");
        }

        var totalAulasNaSemana = await _context.ClassSessionStudents
            .Include(css => css.ClassSession)
            .CountAsync(css =>
                css.StudentId == dto.StudentId &&
                css.ClassSession != null &&
                css.ClassSession.ClassDate.Date >= startOfWeek &&
                css.ClassSession.ClassDate.Date <= endOfWeek &&
                css.Status == "Booked");

        if (totalAulasNaSemana >= student.Plan.ClassesPerWeek)
        {
            return BadRequest($"O aluno já atingiu o limite de {student.Plan.ClassesPerWeek} aula(s) nesta semana de acordo com o plano.");
        }

        var jaAgendado = classSession.ClassSessionStudents
            .Any(css => css.StudentId == dto.StudentId && css.Status != "Cancelled");

        if (jaAgendado)
        {
            return BadRequest("Aluno já está agendado nesta aula.");
        }

        var overrideSlot = await _context.ScheduleSlotOverrides
            .FirstOrDefaultAsync(o =>
                o.ScheduleSlotId == classSession.ScheduleSlotId &&
                o.Date.Date == classSession.ClassDate.Date);

        var maxStudents = overrideSlot?.MaxStudents ?? classSession.ScheduleSlot.MaxStudents;
        var isActive = overrideSlot?.IsActive ?? classSession.ScheduleSlot.IsActive;

        if (!isActive)
        {
            return BadRequest("Este horário está desativado para esta data.");
        }

        var quantidadeAtual = classSession.ClassSessionStudents
            .Count(css => css.Status != "Cancelled");

        if (quantidadeAtual >= maxStudents)
        {
            return BadRequest("Limite de alunos da turma atingido.");
        }

        var booking = new ClassSessionStudent
        {
            ClassSessionId = dto.ClassSessionId,
            StudentId = dto.StudentId,
            Status = "Booked"
        };

        _context.ClassSessionStudents.Add(booking);
        await _context.SaveChangesAsync();

        return Ok("Aluno agendado com sucesso.");
    }

    // AGENDAMENTO CERTO PARA ALUNOS
    [HttpPost("quick-book")]
    public async Task<IActionResult> QuickBookStudent([FromBody] QuickBookStudentDto dto)
    {
        var student = await _context.Students
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.Id == dto.StudentId);

        if (student == null)
        {
            return NotFound("Aluno não encontrado.");
        }

        if (!student.IsActive)
        {
            return BadRequest("Aluno desativado.");
        }

        if (student.Plan == null)
        {
            return BadRequest("O aluno não possui plano vinculado.");
        }

        var scheduleSlot = await _context.ScheduleSlots
            .FirstOrDefaultAsync(s => s.Id == dto.ScheduleSlotId && s.IsActive);

if (scheduleSlot == null)
{
    return NotFound("Horário fixo não encontrado ou está desativado.");
}

        var classDate = DateTime.SpecifyKind(dto.ClassDate.Date, DateTimeKind.Utc);

        if (scheduleSlot.DayOfWeek != classDate.DayOfWeek)
        {
            return BadRequest("A data informada não corresponde ao dia da semana do horário fixo.");
        }

        // Bloqueio para evitar agendamento em horário que já passou
        var fusoBrasil = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
        var agoraBrasil = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, fusoBrasil);

        var dataLocal = new DateTime(
            classDate.Year,
            classDate.Month,
            classDate.Day,
            0,
            0,
            0,
            DateTimeKind.Unspecified
        );

        var inicioAulaLocal = dataLocal.Add(scheduleSlot.StartTime);

        if (inicioAulaLocal <= agoraBrasil)
        {
            return BadRequest("Não é possível agendar em um horário que já passou.");
        }

        var startOfWeek = classDate.DayOfWeek == DayOfWeek.Sunday
            ? classDate.AddDays(-6)
            : classDate.AddDays(-(int)classDate.DayOfWeek + 1);

        var endOfWeek = startOfWeek.AddDays(6);

        var jaTemAulaNoMesmoDia = await _context.ClassSessionStudents
            .Include(css => css.ClassSession)
            .AnyAsync(css =>
                css.StudentId == dto.StudentId &&
                css.ClassSession != null &&
                css.ClassSession.ClassDate.Date == classDate.Date &&
                css.Status == "Booked");

        if (jaTemAulaNoMesmoDia)
        {
            return BadRequest("O aluno já possui uma aula agendada neste dia.");
        }

        var totalAulasNaSemana = await _context.ClassSessionStudents
            .Include(css => css.ClassSession)
            .CountAsync(css =>
                css.StudentId == dto.StudentId &&
                css.ClassSession != null &&
                css.ClassSession.ClassDate.Date >= startOfWeek.Date &&
                css.ClassSession.ClassDate.Date <= endOfWeek.Date &&
                css.Status == "Booked");

        if (totalAulasNaSemana >= student.Plan.ClassesPerWeek)
        {
            return BadRequest($"O aluno já atingiu o limite de {student.Plan.ClassesPerWeek} aula(s) nesta semana de acordo com o plano.");
        }

        var classSession = await _context.ClassSessions
            .Include(cs => cs.ScheduleSlot)
            .Include(cs => cs.ClassSessionStudents)
            .FirstOrDefaultAsync(cs =>
                cs.ScheduleSlotId == dto.ScheduleSlotId &&
                cs.ClassDate.Date == classDate.Date);

        if (classSession == null)
        {
            var startDateTime = classDate.Add(scheduleSlot.StartTime);
            var endDateTime = classDate.Add(scheduleSlot.EndTime);

            classSession = new ClassSession
            {
                ScheduleSlotId = scheduleSlot.Id,
                ClassDate = classDate,
                StartDateTime = startDateTime,
                EndDateTime = endDateTime,
                Status = "Scheduled"
            };

            _context.ClassSessions.Add(classSession);
            await _context.SaveChangesAsync();

            classSession = await _context.ClassSessions
                .Include(cs => cs.ScheduleSlot)
                .Include(cs => cs.ClassSessionStudents)
                .FirstOrDefaultAsync(cs => cs.Id == classSession.Id);
        }

if (classSession == null)
{
    return BadRequest("Não foi possível criar ou localizar a aula.");
}

var jaAgendado = classSession.ClassSessionStudents
    .Any(css => css.StudentId == dto.StudentId && css.Status != "Cancelled");

if (jaAgendado)
{
    return BadRequest("Aluno já está agendado nesta aula.");
}

        if (classSession.ScheduleSlot == null)
        {
            return BadRequest("Horário da aula não encontrado.");
        }

        var overrideSlot = await _context.ScheduleSlotOverrides
            .FirstOrDefaultAsync(o =>
                o.ScheduleSlotId == classSession.ScheduleSlotId &&
                o.Date.Date == classSession.ClassDate.Date);

        var maxStudents = overrideSlot?.MaxStudents ?? classSession.ScheduleSlot.MaxStudents;
        var isActive = overrideSlot?.IsActive ?? classSession.ScheduleSlot.IsActive;

        if (!isActive)
        {
            return BadRequest("Este horário está desativado para esta data.");
        }

        var quantidadeAtual = classSession.ClassSessionStudents
            .Count(css => css.Status != "Cancelled");

        if (quantidadeAtual >= maxStudents)
        {
            return BadRequest("Limite de alunos da turma atingido.");
        }

        var booking = new ClassSessionStudent
        {
            ClassSessionId = classSession.Id,
            StudentId = dto.StudentId,
            Status = "Booked"
        };

        _context.ClassSessionStudents.Add(booking);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Aluno agendado com sucesso.",
            classSessionId = classSession.Id,
            studentId = dto.StudentId,
            classDate = classSession.ClassDate,
            startDateTime = classSession.StartDateTime,
            endDateTime = classSession.EndDateTime
        });
    }

    // REMOVER ALUNO DA AULA
    [HttpPatch("{classSessionId}/remove-student/{studentId}")]
    public async Task<IActionResult> RemoveStudentFromSession(int classSessionId, int studentId)
    {
        var classSession = await _context.ClassSessions
            .Include(cs => cs.ClassSessionStudents)
            .FirstOrDefaultAsync(cs => cs.Id == classSessionId);

        if (classSession == null)
            return NotFound("Aula não encontrada.");

        var booking = classSession.ClassSessionStudents
            .FirstOrDefault(x => x.StudentId == studentId);

        if (booking == null)
            return NotFound("Aluno não está agendado nesta aula.");

        _context.ClassSessionStudents.Remove(booking);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("public-book")]
    public async Task<IActionResult> PublicBook([FromBody] PublicBookingDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
        {
            return BadRequest("O nome é obrigatório.");
        }

        if (string.IsNullOrWhiteSpace(dto.Phone))
        {
            return BadRequest("O telefone é obrigatório.");
        }

        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest("O e-mail é obrigatório.");
        }

        var telefoneLimpo = dto.Phone.Trim();
        var emailLimpo = dto.Email.Trim();

        var student = await _context.Students
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.Phone == telefoneLimpo);

        if (student == null)
        {
            return BadRequest("Aluno não encontrado. Entre em contato com a clínica para finalizar seu cadastro.");
        }

        var resultado = await QuickBookStudent(new QuickBookStudentDto
        {
            StudentId = student.Id,
            ScheduleSlotId = dto.ScheduleSlotId,
            ClassDate = dto.ClassDate
        });

        if (resultado is OkObjectResult okResult)
        {
            var scheduleSlot = await _context.ScheduleSlots
                .FirstOrDefaultAsync(s => s.Id == dto.ScheduleSlotId);

            if (scheduleSlot != null)
            {
                var dataAula = dto.ClassDate.ToLocalTime().ToString("dd/MM/yyyy");
                var horarioInicio = scheduleSlot.StartTime.ToString(@"hh\:mm");
                var horarioFim = scheduleSlot.EndTime.ToString(@"hh\:mm");

                var assunto = "Agendamento confirmado - Clínica Pilates";

                var html = $@"
                    <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #222;'>
                        <h2>Agendamento confirmado</h2>
                        <p>Olá, <strong>{dto.FullName}</strong>!</p>
                        <p>Sua aula foi agendada com sucesso.</p>

                        <div style='background:#f6f6f6; padding:16px; border-radius:8px; margin:16px 0;'>
                            <p style='margin:0 0 8px 0;'><strong>Data:</strong> {dataAula}</p>
                            <p style='margin:0 0 8px 0;'><strong>Horário:</strong> {horarioInicio} às {horarioFim}</p>
                            <p style='margin:0;'><strong>Clínica:</strong> Clínica Pilates</p>
                        </div>

                        <p>Em caso de dúvidas, entre em contato com a clínica.</p>
                        <p>Atenciosamente,<br />Clínica Pilates</p>
                    </div>";

                try
                {
                    await _emailService.SendEmailAsync(
                        emailLimpo,
                        dto.FullName,
                        assunto,
                        html
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Erro ao enviar e-mail de confirmação: {ex.Message}");
                }
            }
        }

        return resultado;
    }

    // REGISTRAR PRESENÇA DO ALUNO
    [HttpPatch("{classSessionId}/presenca/{studentId}")]
    public async Task<IActionResult> AtualizarPresenca(int classSessionId, int studentId, [FromBody] PresencaDto dto)
    {
        var validStatuses = new[] { "Present", "Absent" };

        if (!validStatuses.Contains(dto.Status))
        {
            return BadRequest("Status inválido. Use apenas 'Present' ou 'Absent'.");
        }

        var booking = await _context.ClassSessionStudents
            .Include(css => css.ClassSession)
            .Include(css => css.Student)
            .FirstOrDefaultAsync(css =>
                css.ClassSessionId == classSessionId &&
                css.StudentId == studentId);

        if (booking == null)
        {
            return NotFound("Agendamento do aluno nesta aula não foi encontrado.");
        }

        if (booking.Status == "Cancelled")
        {
            return BadRequest("Não é possível registrar presença para um agendamento cancelado.");
        }

        booking.Status = dto.Status;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Presença registrada com sucesso.",
            classSessionId = booking.ClassSessionId,
            studentId = booking.StudentId,
            status = booking.Status
        });
    }

    // REGISTRAR APARELHO USADO PELO ALUNO
    [HttpPatch("{classSessionId}/equipamento/{studentId}")]
    public async Task<IActionResult> RegistrarEquipamento(int classSessionId, int studentId, [FromBody] EquipamentoDto dto)
    {
        var booking = await _context.ClassSessionStudents
            .Include(css => css.ClassSession)
            .Include(css => css.Student)
            .FirstOrDefaultAsync(css =>
                css.ClassSessionId == classSessionId &&
                css.StudentId == studentId);

        if (booking == null)
        {
            return NotFound("Agendamento do aluno nesta aula não foi encontrado.");
        }

        if (booking.Status != "Present")
        {
            return BadRequest("Só é possível registrar aparelho para aluno com presença registrada.");
        }

        booking.EquipmentUsed = dto.EquipmentUsed?.Trim() ?? string.Empty;
        booking.EquipmentNotes = dto.EquipmentNotes?.Trim() ?? string.Empty;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Aparelho registrado com sucesso.",
            classSessionId = booking.ClassSessionId,
            studentId = booking.StudentId,
            studentName = booking.Student?.FullName ?? "Aluno não encontrado",
            equipmentUsed = booking.EquipmentUsed,
            equipmentNotes = booking.EquipmentNotes
        });
    }

    // CANCELAR AULA PARA ALUNO E GERAR CRÉDITO PARA REPOSIÇÃO
    [HttpPatch("{classSessionId}/cancel-student/{studentId}")]
    public async Task<IActionResult> CancelStudentBooking(int classSessionId, int studentId)
    {
        var booking = await _context.ClassSessionStudents
            .Include(css => css.ClassSession)
            .Include(css => css.Student)
            .FirstOrDefaultAsync(css =>
                css.ClassSessionId == classSessionId &&
                css.StudentId == studentId);

        if (booking == null)
        {
            return NotFound("Agendamento do aluno nesta aula não foi encontrado.");
        }

        if (booking.Status == "Cancelled")
        {
            return BadRequest("Este agendamento já foi cancelado.");
        }

        if (booking.Status == "Present" || booking.Status == "Absent")
        {
            return BadRequest("Não é possível cancelar uma aula que já teve presença registrada.");
        }

        if (booking.ClassSession == null)
        {
            return BadRequest("A aula vinculada ao agendamento não foi encontrada.");
        }

        var limiteCancelamento = booking.ClassSession.StartDateTime.AddHours(-2);

        booking.Status = "Cancelled";
        booking.HasMakeupCredit = DateTime.UtcNow < limiteCancelamento;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = booking.HasMakeupCredit
                ? "Aula cancelada com sucesso. O aluno tem direito a crédito para reposição."
                : "Aula cancelada com sucesso. O aluno não tem direito a crédito, pois cancelou com menos de 2 horas de antecedência.",
            classSessionId = booking.ClassSessionId,
            studentId = booking.StudentId,
            studentName = booking.Student?.FullName ?? "Aluno não encontrado",
            status = booking.Status,
            makeupCreditStatus = booking.HasMakeupCredit
                ? "Tem direito a crédito"
                : "Não tem direito a crédito"
        });
    }

    // REAGENDAR AULA PARA ALUNO USANDO CRÉDITO DE REPOSIÇÃO
    [HttpPost("reschedule")]
    public async Task<IActionResult> RescheduleStudent([FromBody] RescheduleStudentDto dto)
    {
        var student = await _context.Students
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.Id == dto.StudentId);

        if (student == null)
        {
            return NotFound("Aluno não encontrado.");
        }

        if (!student.IsActive)
        {
            return BadRequest("Aluno desativado.");
        }

        if (student.Plan == null)
        {
            return BadRequest("O aluno não possui plano vinculado.");
        }

        var oldBooking = await _context.ClassSessionStudents
            .Include(css => css.ClassSession)
            .FirstOrDefaultAsync(css =>
                css.StudentId == dto.StudentId &&
                css.ClassSessionId == dto.OldClassSessionId);

        if (oldBooking == null)
        {
            return NotFound("Agendamento antigo não encontrado.");
        }

        if (oldBooking.Status != "Cancelled")
        {
            return BadRequest("A remarcação só pode ser feita para aulas canceladas.");
        }

        if (!oldBooking.HasMakeupCredit)
        {
            return BadRequest("Este cancelamento não gerou crédito para reposição.");
        }

        if (oldBooking.MakeupCreditUsed)
        {
            return BadRequest("O crédito desta aula já foi utilizado.");
        }

        var scheduleSlot = await _context.ScheduleSlots
            .FirstOrDefaultAsync(s => s.Id == dto.NewScheduleSlotId && s.IsActive);

        if (scheduleSlot == null)
        {
            return NotFound("Novo horário fixo não encontrado ou está desativado.");
        }

        var newClassDate = DateTime.SpecifyKind(dto.NewClassDate.Date, DateTimeKind.Utc);

        if (scheduleSlot.DayOfWeek != newClassDate.DayOfWeek)
        {
            return BadRequest("A nova data informada não corresponde ao dia da semana do horário fixo.");
        }

        var startOfWeek = newClassDate.DayOfWeek == DayOfWeek.Sunday
            ? newClassDate.AddDays(-6)
            : newClassDate.AddDays(-(int)newClassDate.DayOfWeek + 1);

        var endOfWeek = startOfWeek.AddDays(6);

        var jaTemAulaNoMesmoDia = await _context.ClassSessionStudents
            .Include(css => css.ClassSession)
            .AnyAsync(css =>
                css.StudentId == dto.StudentId &&
                css.ClassSession != null &&
                css.ClassSession.ClassDate.Date == newClassDate.Date &&
                css.Status != "Cancelled");

        if (jaTemAulaNoMesmoDia)
        {
            return BadRequest("O aluno já possui uma aula agendada nesta data.");
        }

        var totalAulasNaSemana = await _context.ClassSessionStudents
            .Include(css => css.ClassSession)
            .CountAsync(css =>
                css.StudentId == dto.StudentId &&
                css.ClassSession != null &&
                css.ClassSession.ClassDate.Date >= startOfWeek.Date &&
                css.ClassSession.ClassDate.Date <= endOfWeek.Date &&
                css.Status != "Cancelled");

        if (totalAulasNaSemana >= student.Plan.ClassesPerWeek)
        {
            return BadRequest($"O aluno já atingiu o limite de {student.Plan.ClassesPerWeek} aula(s) nesta semana de acordo com o plano.");
        }

        var newClassSession = await _context.ClassSessions
            .Include(cs => cs.ScheduleSlot)
            .Include(cs => cs.ClassSessionStudents)
            .FirstOrDefaultAsync(cs =>
                cs.ScheduleSlotId == dto.NewScheduleSlotId &&
                cs.ClassDate.Date == newClassDate.Date);

        if (newClassSession == null)
        {
            var startDateTime = newClassDate.Add(scheduleSlot.StartTime);
            var endDateTime = newClassDate.Add(scheduleSlot.EndTime);

            newClassSession = new ClassSession
            {
                ScheduleSlotId = scheduleSlot.Id,
                ClassDate = newClassDate,
                StartDateTime = startDateTime,
                EndDateTime = endDateTime,
                Status = "Scheduled"
            };

            _context.ClassSessions.Add(newClassSession);
            await _context.SaveChangesAsync();

            newClassSession = await _context.ClassSessions
                .Include(cs => cs.ScheduleSlot)
                .Include(cs => cs.ClassSessionStudents)
                .FirstOrDefaultAsync(cs => cs.Id == newClassSession.Id);
        }

        if (newClassSession == null)
        {
            return BadRequest("Não foi possível criar ou localizar a nova aula.");
        }

        var jaAgendadoNaNovaAula = newClassSession.ClassSessionStudents
            .Any(css => css.StudentId == dto.StudentId && css.Status != "Cancelled");

        if (jaAgendadoNaNovaAula)
        {
            return BadRequest("O aluno já está agendado nesta nova aula.");
        }

        if (newClassSession.ScheduleSlot == null)
        {
            return BadRequest("Horário da nova aula não encontrado.");
        }

        var overrideSlot = await _context.ScheduleSlotOverrides
            .FirstOrDefaultAsync(o =>
                o.ScheduleSlotId == newClassSession.ScheduleSlotId &&
                o.Date.Date == newClassSession.ClassDate.Date);

        var maxStudents = overrideSlot?.MaxStudents ?? newClassSession.ScheduleSlot.MaxStudents;
        var isActive = overrideSlot?.IsActive ?? newClassSession.ScheduleSlot.IsActive;

        if (!isActive)
        {
            return BadRequest("Este horário está desativado para esta data.");
        }

        var quantidadeAtual = newClassSession.ClassSessionStudents
            .Count(css => css.Status != "Cancelled");

        if (quantidadeAtual >= maxStudents)
        {
            return BadRequest("Limite de alunos da nova turma atingido.");
        }

        var newBooking = new ClassSessionStudent
        {
            ClassSessionId = newClassSession.Id,
            StudentId = dto.StudentId,
            Status = "Booked",
            HasMakeupCredit = false,
            MakeupCreditUsed = false
        };

        _context.ClassSessionStudents.Add(newBooking);

        oldBooking.MakeupCreditUsed = true;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Aula remarcada com sucesso.",
            studentId = dto.StudentId,
            studentName = student.FullName,
            oldClassSessionId = dto.OldClassSessionId,
            newClassSessionId = newClassSession.Id,
            newClassDate = newClassSession.ClassDate,
            startDateTime = newClassSession.StartDateTime,
            endDateTime = newClassSession.EndDateTime,
            creditStatus = "Crédito utilizado com sucesso"
        });
    }
}
