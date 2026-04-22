using ClinicaPilates.Api.Data;
using ClinicaPilates.Api.DTOs;
using ClinicaPilates.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ClinicaPilates.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [AllowAnonymous]
    [HttpPost("bootstrap-admin")]
    public async Task<ActionResult> BootstrapAdmin(BootstrapAdminDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminJaExiste = await _context.Users
            .AnyAsync(u => u.Role == "Admin");

        if (adminJaExiste)
        {
            return BadRequest("O primeiro administrador já foi criado. Agora é necessário fazer login.");
        }

        var emailJaExiste = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());

        if (emailJaExiste)
        {
            return BadRequest("Já existe um usuário com este e-mail.");
        }

        var admin = new User
        {
            Name = dto.Name.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = GenerateHash(dto.Password),
            Role = "Admin",
            IsActive = true
        };

        _context.Users.Add(admin);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Primeiro administrador criado com sucesso."
        });
    }

    [AllowAnonymous]
    [HttpGet("bootstrap-status")]
    public async Task<ActionResult> GetBootstrapStatus()
    {
        var adminExists = await _context.Users
            .AnyAsync(u => u.Role == "Admin");

        return Ok(new
        {
            adminExists
        });
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult> Login(LoginDto dto)
    {
        var user = await _context.Users
            .Include(u => u.Student)
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user == null)
        {
            return Unauthorized("E-mail ou senha inválidos.");
        }

        var passwordHash = GenerateHash(dto.Password);

        if (user.PasswordHash != passwordHash)
        {
            return Unauthorized("E-mail ou senha inválidos.");
        }

        if (!user.IsActive)
        {
            return Unauthorized("Usuário inativo.");
        }

        var token = GenerateJwtToken(user);

        return Ok(new
        {
            message = "Login realizado com sucesso",
            token,
            user = new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Role,
                StudentId = user.Student?.Id
            }
        });
    }

    private string GenerateHash(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(password);
        var hash = sha256.ComputeHash(bytes);

        return Convert.ToBase64String(hash);
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}