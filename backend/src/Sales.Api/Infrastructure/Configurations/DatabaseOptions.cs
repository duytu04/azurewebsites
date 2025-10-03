namespace Sales.Api.Infrastructure.Configurations;

public class DatabaseOptions
{
    public const string SectionName = "Database";

    public bool ApplyMigrations { get; set; } = true;
    public bool SeedDemoData { get; set; } = false;
}
