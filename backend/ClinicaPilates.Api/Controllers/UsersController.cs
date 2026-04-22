using ClinicaPilates.Api.Data;
using ClinicaPilates.Api.DTOs;
using ClinicaPilates.Api.Models;
using ClinicaPilates.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace ClinicaPilates.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly BrevoEmailService _emailService;

    public UsersController(AppDbContext context, BrevoEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    [HttpPost("test-email")]
    public async Task<IActionResult> SendTestEmail()
    {
        await _emailService.SendEmailAsync(
            "eemailtesteeeeeeee@gmail.com",
            "Teste",
            "Teste de envio 🚀",
            "<h1>Email funcionando!</h1><p>Seu sistema está enviando emails 🔥</p>"
        );

        return Ok("Email enviado!");
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetUsers()
    {
        var users = await _context.Users
            .Select(user => new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                StudentId = user.Student != null ? user.Student.Id : null
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserResponseDto>> GetUserById(int id)
    {
        var user = await _context.Users
            .Where(u => u.Id == id)
            .Select(u => new UserResponseDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                StudentId = u.Student != null ? u.Student.Id : null
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound("Usuário não encontrado.");
        }

        return Ok(user);
    }

    [HttpPatch("{id}/deactivate")]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound("Usuário não encontrado.");
        }

        user.IsActive = false;

        await _context.SaveChangesAsync();

        return Ok("Usuário desativado com sucesso.");
    }

    [HttpPost]
    public async Task<ActionResult<UserResponseDto>> CreateUser(CreateUserDto dto)
    {
        var emailJaExiste = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());

        if (emailJaExiste)
        {
            return BadRequest("Já existe um usuário cadastrado com este e-mail.");
        }

        var role = dto.Role.Trim();

        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Somente usuários administradores podem ser criados.");
        }

        role = "Admin";

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = HashPassword(dto.Password),
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var response = new UserResponseDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            StudentId = null
        };

        return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, response);
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(password);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }
}