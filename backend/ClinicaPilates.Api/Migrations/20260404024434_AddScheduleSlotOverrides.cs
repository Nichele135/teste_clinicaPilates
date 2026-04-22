using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicaPilates.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduleSlotOverrides : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxStudents",
                table: "ScheduleSlotOverrides");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "ScheduleSlotOverrides",
                newName: "IsAvailable");

            migrationBuilder.AddColumn<int>(
                name: "MaxStudentsOverride",
                table: "ScheduleSlotOverrides",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxStudentsOverride",
                table: "ScheduleSlotOverrides");

            migrationBuilder.RenameColumn(
                name: "IsAvailable",
                table: "ScheduleSlotOverrides",
                newName: "IsActive");

            migrationBuilder.AddColumn<int>(
                name: "MaxStudents",
                table: "ScheduleSlotOverrides",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
