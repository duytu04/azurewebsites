namespace Sales.Api.DTOs;

public record CustomerDto(Guid Id, string FullName, string Email, string? PhoneNumber, DateTimeOffset CreatedAt);

public record CreateCustomerRequest(string FullName, string Email, string? PhoneNumber);

public record UpdateCustomerRequest(string FullName, string Email, string? PhoneNumber);
