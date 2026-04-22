using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicaPilates.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEquipmentFieldsToClassSessionStudent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EquipmentNotes",
                table: "ClassSessionStudents",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EquipmentUsed",
                table: "ClassSessionStudents",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EquipmentNotes",
                table: "ClassSessionStudents");

            migrationBuilder.DropColumn(
                name: "EquipmentUsed",
                table: "ClassSessionStudents");
        }
    }
}
