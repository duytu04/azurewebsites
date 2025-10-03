using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Sales.Api.Domain.Entities;
using Sales.Api.Infrastructure.Configurations;

namespace Sales.Api.Infrastructure.Data;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, DatabaseOptions databaseOptions, CancellationToken cancellationToken = default)
    {
        if (!databaseOptions.ApplyMigrations && !databaseOptions.SeedDemoData)
        {
            return;
        }

        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        if (databaseOptions.ApplyMigrations)
        {
            await context.Database.MigrateAsync(cancellationToken);
        }

        if (!databaseOptions.SeedDemoData)
        {
            return;
        }

        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<AppUser>>();

        if (!await context.Users.AnyAsync(cancellationToken))
        {
            var admin = new AppUser
            {
                Email = "admin@sales.local",
                FullName = "Administrator",
                Role = UserRole.Admin,
                CreatedAt = DateTimeOffset.UtcNow
            };

            admin.PasswordHash = passwordHasher.HashPassword(admin, "Admin@12345");

            await context.Users.AddAsync(admin, cancellationToken);
        }

        if (!await context.Products.AnyAsync(cancellationToken))
        {
            await context.Products.AddRangeAsync([
                new Product { Name = "Sample Laptop", Description = "Demo product", Price = 1200m, Stock = 5 },
                new Product { Name = "Sample Phone", Description = "Demo product", Price = 650m, Stock = 10 }
            ], cancellationToken);
        }

        if (!await context.Customers.AnyAsync(cancellationToken))
        {
            await context.Customers.AddAsync(new Customer
            {
                FullName = "Demo Customer",
                Email = "customer@sales.local",
                CreatedAt = DateTimeOffset.UtcNow
            }, cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
