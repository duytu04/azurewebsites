namespace Sales.Api.DTOs;

public record OrderItemRequest(Guid ProductId, int Quantity);

public record CreateOrderRequest(Guid CustomerId, IReadOnlyCollection<OrderItemRequest> Items);

public record UpdateOrderRequest(Guid CustomerId, IReadOnlyCollection<OrderItemRequest> Items);

public record OrderItemDto(Guid Id, Guid ProductId, string ProductName, int Quantity, decimal UnitPrice, decimal LineTotal);

public record OrderDto(Guid Id, Guid CustomerId, string CustomerName, string CustomerEmail, DateTimeOffset CreatedAt, decimal TotalAmount, IReadOnlyCollection<OrderItemDto> Items);
