using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

public class BrevoEmailService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public BrevoEmailService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task SendEmailAsync(string toEmail, string toName, string subject, string htmlContent)
    {
        var apiKey = _configuration["Brevo:ApiKey"];
        var senderEmail = _configuration["Brevo:SenderEmail"];
        var senderName = _configuration["Brevo:SenderName"];

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("api-key", apiKey);

        var body = new
        {
            sender = new
            {
                name = senderName,
                email = senderEmail
            },
            to = new[]
            {
                new { email = toEmail, name = toName }
            },
            subject = subject,
            htmlContent = htmlContent
        };

        var json = JsonSerializer.Serialize(body);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync("https://api.brevo.com/v3/smtp/email", content);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Erro ao enviar email: {error}");
        }
    }
}