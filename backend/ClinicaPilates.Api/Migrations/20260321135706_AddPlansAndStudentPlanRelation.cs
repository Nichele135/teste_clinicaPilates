using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ClinicaPilates.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPlansAndStudentPlanRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PlanId",
                table: "Students",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Plans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Periodicity = table.Column<string>(type: "text", nullable: false),
                    ClassesPerWeek = table.Column<int>(type: "integer", nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Plans", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Plans",
                columns: new[] { "Id", "ClassesPerWeek", "IsActive", "Name", "Periodicity", "Price" },
                values: new object[,]
                {
                    { 1, 1, true, "1x por semana", "Mensal", 210m },
                    { 2, 2, true, "2x por semana", "Mensal", 350m },
                    { 3, 3, true, "3x por semana", "Mensal", 430m },
                    { 4, 1, true, "1x por semana", "Semestral - Recorrente", 180m },
                    { 5, 2, true, "2x por semana", "Semestral - Recorrente", 300m },
                    { 6, 3, true, "3x por semana", "Semestral - Recorrente", 390m },
                    { 7, 1, true, "1x por semana", "Anual - Recorrente", 170m },
                    { 8, 2, true, "2x por semana", "Anual - Recorrente", 285m },
                    { 9, 3, true, "3x por semana", "Anual - Recorrente", 370m }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Students_PlanId",
                table: "Students",
                column: "PlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_Students_Plans_PlanId",
                table: "Students",
                column: "PlanId",
                principalTable: "Plans",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Students_Plans_PlanId",
                table: "Students");

            migrationBuilder.DropTable(
                name: "Plans");

            migrationBuilder.DropIndex(
                name: "IX_Students_PlanId",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "PlanId",
                table: "Students");
        }
    }
}
