using Microsoft.EntityFrameworkCore;
using Sales.Api.Domain.Entities;
using Sales.Api.DTOs;
using Sales.Api.Infrastructure.Data;
using Sales.Api.Services.Interfaces;

namespace Sales.Api.Services;

public class OrderService(ApplicationDbContext dbContext, ILogger<OrderService> logger) : IOrderService
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly ILogger<OrderService> _logger = logger;

    public async Task<Order> CreateOrderAsync(CreateOrderRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.Items is null || request.Items.Count == 0)
        {
            throw new InvalidOperationException("Order must contain at least one item.");
        }

        var customer = await _dbContext.Customers
            .FirstOrDefaultAsync(c => c.Id == request.CustomerId, cancellationToken);

        if (customer is null)
        {
            throw new InvalidOperationException("Customer not found.");
        }

        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();

        var products = await _dbContext.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        if (products.Count != productIds.Count)
        {
            throw new InvalidOperationException("One or more products were not found.");
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var order = new Order
            {
                CustomerId = request.CustomerId,
                CreatedAt = DateTimeOffset.UtcNow,
                Items = new List<OrderItem>()
            };

            decimal total = 0m;

            foreach (var item in request.Items)
            {
                if (item.Quantity <= 0)
                {
                    throw new InvalidOperationException("Quantity must be greater than zero.");
                }

                var product = products[item.ProductId];

                if (product.Stock < item.Quantity)
                {
                    throw new InvalidOperationException($"Insufficient stock for product '{product.Name}'.");
                }

                product.Stock -= item.Quantity;
                product.UpdatedAt = DateTimeOffset.UtcNow;

                var lineTotal = Math.Round(product.Price * item.Quantity, 2, MidpointRounding.AwayFromZero);

                order.Items.Add(new OrderItem
                {
                    ProductId = product.Id,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price,
                    LineTotal = lineTotal
                });

                total += lineTotal;
            }

            order.TotalAmount = Math.Round(total, 2, MidpointRounding.AwayFromZero);

            await _dbContext.Orders.AddAsync(order, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return order;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Failed to create order for customer {CustomerId}", request.CustomerId);
            throw;
        }
    }

    public async Task<Order> UpdateOrderAsync(Guid orderId, UpdateOrderRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.Items is null || request.Items.Count == 0)
        {
            throw new InvalidOperationException("Order must contain at least one item.");
        }

        var order = await _dbContext.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order is null)
        {
            throw new KeyNotFoundException("Order not found.");
        }

        var customer = await _dbContext.Customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId, cancellationToken);

        if (customer is null)
        {
            throw new InvalidOperationException("Customer not found.");
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            foreach (var existingItem in order.Items)
            {
                var product = existingItem.Product;
                product.Stock += existingItem.Quantity;
                product.UpdatedAt = DateTimeOffset.UtcNow;
            }

            _dbContext.OrderItems.RemoveRange(order.Items);
            order.Items.Clear();

            var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();

            var products = await _dbContext.Products
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, cancellationToken);

            if (products.Count != productIds.Count)
            {
                throw new InvalidOperationException("One or more products were not found.");
            }

            decimal total = 0m;

            foreach (var item in request.Items)
            {
                if (item.Quantity <= 0)
                {
                    throw new InvalidOperationException("Quantity must be greater than zero.");
                }

                var product = products[item.ProductId];

                if (product.Stock < item.Quantity)
                {
                    throw new InvalidOperationException($"Insufficient stock for product '{product.Name}'.");
                }

                product.Stock -= item.Quantity;
                product.UpdatedAt = DateTimeOffset.UtcNow;

                var lineTotal = Math.Round(product.Price * item.Quantity, 2, MidpointRounding.AwayFromZero);

                var orderItem = new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = product.Id,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price,
                    LineTotal = lineTotal
                };

                order.Items.Add(orderItem);
                total += lineTotal;
            }

            order.CustomerId = customer.Id;
            order.TotalAmount = Math.Round(total, 2, MidpointRounding.AwayFromZero);

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return order;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Failed to update order {OrderId}", orderId);
            throw;
        }
    }

    public async Task DeleteOrderAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await _dbContext.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order is null)
        {
            throw new KeyNotFoundException("Order not found.");
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            foreach (var item in order.Items)
            {
                var product = item.Product;
                product.Stock += item.Quantity;
                product.UpdatedAt = DateTimeOffset.UtcNow;
            }

            _dbContext.OrderItems.RemoveRange(order.Items);
            _dbContext.Orders.Remove(order);

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Failed to delete order {OrderId}", orderId);
            throw;
        }
    }
}
