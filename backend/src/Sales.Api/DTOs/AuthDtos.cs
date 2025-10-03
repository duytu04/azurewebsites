namespace Sales.Api.DTOs;

public record RegisterRequest(string FullName, string Email, string Password, string? Role = null);

public record LoginRequest(string Email, string Password);

public record AuthResponse(string Token, DateTimeOffset ExpiresAt, string Email, string FullName, string Role);
