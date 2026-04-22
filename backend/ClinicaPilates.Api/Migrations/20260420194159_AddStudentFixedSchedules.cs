using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ClinicaPilates.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentFixedSchedules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StudentFixedSchedules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StudentId = table.Column<int>(type: "integer", nullable: false),
                    ScheduleSlotId = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentFixedSchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentFixedSchedules_ScheduleSlots_ScheduleSlotId",
                        column: x => x.ScheduleSlotId,
                        principalTable: "ScheduleSlots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentFixedSchedules_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudentFixedSchedules_ScheduleSlotId",
                table: "StudentFixedSchedules",
                column: "ScheduleSlotId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentFixedSchedules_StudentId_ScheduleSlotId",
                table: "StudentFixedSchedules",
                columns: new[] { "StudentId", "ScheduleSlotId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentFixedSchedules");
        }
    }
}
