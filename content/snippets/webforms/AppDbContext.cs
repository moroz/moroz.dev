using System.Data.Entity;
using Npgsql;

namespace MyApp.Models
{
    [DbConfigurationType(typeof(NpgSqlConfiguration))]
    public class AppDbContext : DbContext
    {
        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema("public");
        }
    }

    public class NpgSqlConfiguration : DbConfiguration
    {
        public NpgSqlConfiguration()
        {
            var name = "Npgsql";

            SetProviderFactory(providerInvariantName: name, providerFactory: NpgsqlFactory.Instance);
            SetProviderServices(providerInvariantName: name, provider: NpgsqlServices.Instance);
            SetDefaultConnectionFactory(connectionFactory: new NpgsqlConnectionFactory());
        }
    }
}
