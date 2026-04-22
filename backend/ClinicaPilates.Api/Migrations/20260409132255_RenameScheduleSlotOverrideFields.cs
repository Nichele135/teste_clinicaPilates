using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicaPilates.Api.Migrations
{
    /// <inheritdoc />
    public partial class RenameScheduleSlotOverrideFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "MaxStudentsOverride",
                table: "ScheduleSlotOverrides",
                newName: "MaxStudents");

            migrationBuilder.RenameColumn(
                name: "IsAvailable",
                table: "ScheduleSlotOverrides",
                newName: "IsActive");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "MaxStudents",
                table: "ScheduleSlotOverrides",
                newName: "MaxStudentsOverride");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "ScheduleSlotOverrides",
                newName: "IsAvailable");
        }
    }
}
