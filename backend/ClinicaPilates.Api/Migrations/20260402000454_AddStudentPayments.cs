using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ClinicaPilates.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StudentPayments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StudentId = table.Column<int>(type: "integer", nullable: false),
                    ReferenceMonth = table.Column<int>(type: "integer", nullable: false),
                    ReferenceYear = table.Column<int>(type: "integer", nullable: false),
                    PlanName = table.Column<string>(type: "text", nullable: false),
                    PlanPrice = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentPayments_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudentPayments_StudentId_ReferenceMonth_ReferenceYear",
                table: "StudentPayments",
                columns: new[] { "StudentId", "ReferenceMonth", "ReferenceYear" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentPayments");
        }
    }
}
