using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sales.Api.Domain.Entities;
using Sales.Api.DTOs;
using Sales.Api.Infrastructure.Data;
using Sales.Api.Mapping;

namespace Sales.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(ApplicationDbContext dbContext) : ControllerBase
{
    private readonly ApplicationDbContext _dbContext = dbContext;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts(CancellationToken cancellationToken)
    {
        var products = await _dbContext.Products
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProductDto(p.Id, p.Name, p.Description, p.Price, p.Stock, p.CreatedAt, p.UpdatedAt))
            .ToListAsync(cancellationToken);

        return Ok(products);
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<ProductDto>> CreateProduct(CreateProductRequest request, CancellationToken cancellationToken)
    {
        if (request.Stock < 0)
        {
            return BadRequest(new { message = "Stock cannot be negative." });
        }

        if (request.Price <= 0)
        {
            return BadRequest(new { message = "Price must be greater than zero." });
        }

        var product = new Product
        {
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Price = Math.Round(request.Price, 2, MidpointRounding.AwayFromZero),
            Stock = request.Stock,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await _dbContext.Products.AddAsync(product, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetProducts), new { id = product.Id }, product.ToDto());
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<ProductDto>> UpdateProduct(Guid id, UpdateProductRequest request, CancellationToken cancellationToken)
    {
        if (request.Price <= 0)
        {
            return BadRequest(new { message = "Price must be greater than zero." });
        }

        var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product is null)
        {
            return NotFound();
        }

        product.Name = request.Name.Trim();
        product.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        product.Price = Math.Round(request.Price, 2, MidpointRounding.AwayFromZero);
        product.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(product.ToDto());
    }

    [HttpPut("{id:guid}/stock")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<ProductDto>> UpdateStock(Guid id, UpdateStockRequest request, CancellationToken cancellationToken)
    {
        if (request.Amount == 0)
        {
            return BadRequest(new { message = "Amount must be non-zero." });
        }

        var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product is null)
        {
            return NotFound();
        }

        var newStock = product.Stock + request.Amount;

        if (newStock < 0)
        {
            return BadRequest(new { message = "Stock cannot drop below zero." });
        }

        product.Stock = newStock;
        product.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(product.ToDto());
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> DeleteProduct(Guid id, CancellationToken cancellationToken)
    {
        var product = await _dbContext.Products
            .Include(p => p.OrderItems)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product is null)
        {
            return NotFound();
        }

        if (product.OrderItems.Count > 0)
        {
            return Conflict(new { message = "Cannot delete a product that has order history." });
        }

        _dbContext.Products.Remove(product);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
