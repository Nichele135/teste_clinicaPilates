using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicaPilates.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddClassSessionStudentsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClassSessions_Users_InstructorId",
                table: "ClassSessions");

            migrationBuilder.DropIndex(
                name: "IX_ClassSessions_InstructorId",
                table: "ClassSessions");

            migrationBuilder.DropColumn(
                name: "InstructorId",
                table: "ClassSessions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "InstructorId",
                table: "ClassSessions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassSessions_InstructorId",
                table: "ClassSessions",
                column: "InstructorId");

            migrationBuilder.AddForeignKey(
                name: "FK_ClassSessions_Users_InstructorId",
                table: "ClassSessions",
                column: "InstructorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
