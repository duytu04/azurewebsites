using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sales.Api.Domain.Entities;
using Sales.Api.DTOs;
using Sales.Api.Infrastructure.Data;
using Sales.Api.Mapping;

namespace Sales.Api.Controllers;

[Authorize(Roles = nameof(UserRole.Admin))]
[ApiController]
[Route("api/[controller]")]
public class CustomersController(ApplicationDbContext dbContext) : ControllerBase
{
    private readonly ApplicationDbContext _dbContext = dbContext;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> GetCustomers([FromQuery] string? email, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(email))
        {
            var normalizedEmail = email.Trim().ToLowerInvariant();
            var customer = await _dbContext.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Email == normalizedEmail, cancellationToken);

            if (customer is null)
            {
                return NotFound();
            }

            return Ok(customer.ToDto());
        }

        var customers = await _dbContext.Customers
            .AsNoTracking()
            .OrderBy(c => c.FullName)
            .Select(c => new CustomerDto(c.Id, c.FullName, c.Email, c.PhoneNumber, c.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(customers);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CustomerDto>> GetCustomerById(Guid id, CancellationToken cancellationToken)
    {
        var customer = await _dbContext.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        return customer is null ? NotFound() : Ok(customer.ToDto());
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> CreateCustomer(CreateCustomerRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var exists = await _dbContext.Customers
            .AnyAsync(c => c.Email == normalizedEmail, cancellationToken);

        if (exists)
        {
            return Conflict(new { message = "Email already exists." });
        }

        var customer = new Customer
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        await _dbContext.Customers.AddAsync(customer, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetCustomerById), new { id = customer.Id }, customer.ToDto());
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CustomerDto>> UpdateCustomer(Guid id, UpdateCustomerRequest request, CancellationToken cancellationToken)
    {
        var customer = await _dbContext.Customers.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (customer is null)
        {
            return NotFound();
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var emailChanged = !string.Equals(customer.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase);

        if (emailChanged)
        {
            var exists = await _dbContext.Customers
                .AnyAsync(c => c.Email == normalizedEmail && c.Id != id, cancellationToken);

            if (exists)
            {
                return Conflict(new { message = "Email already exists." });
            }

            customer.Email = normalizedEmail;
        }

        customer.FullName = request.FullName.Trim();
        customer.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(customer.ToDto());
    }
}
