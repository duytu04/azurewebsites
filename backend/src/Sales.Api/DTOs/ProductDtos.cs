namespace Sales.Api.DTOs;

public record ProductDto(Guid Id, string Name, string? Description, decimal Price, int Stock, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);

public record CreateProductRequest(string Name, string? Description, decimal Price, int Stock);

public record UpdateProductRequest(string Name, string? Description, decimal Price);

public record UpdateStockRequest(int Amount);
