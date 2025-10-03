using Sales.Api.Domain.Entities;
using Sales.Api.DTOs;

namespace Sales.Api.Mapping;

public static class MappingExtensions
{
    public static CustomerDto ToDto(this Customer customer)
        => new(customer.Id, customer.FullName, customer.Email, customer.PhoneNumber, customer.CreatedAt);

    public static ProductDto ToDto(this Product product)
        => new(product.Id, product.Name, product.Description, product.Price, product.Stock, product.CreatedAt, product.UpdatedAt);

    public static OrderItemDto ToDto(this OrderItem item)
        => new(item.Id, item.ProductId, item.Product?.Name ?? string.Empty, item.Quantity, item.UnitPrice, item.LineTotal);

    public static OrderDto ToDto(this Order order)
        => new(order.Id,
               order.CustomerId,
               order.Customer?.FullName ?? string.Empty,
               order.Customer?.Email ?? string.Empty,
               order.CreatedAt,
               order.TotalAmount,
               order.Items.Select(i => i.ToDto()).ToList());
}
