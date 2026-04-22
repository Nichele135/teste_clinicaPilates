using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicaPilates.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMakeupCreditUsedToClassSessionStudent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "MakeupCreditUsed",
                table: "ClassSessionStudents",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MakeupCreditUsed",
                table: "ClassSessionStudents");
        }
    }
}
