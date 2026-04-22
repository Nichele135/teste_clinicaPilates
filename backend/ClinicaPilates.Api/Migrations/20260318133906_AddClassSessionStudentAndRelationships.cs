using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicaPilates.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddClassSessionStudentAndRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "InstructorId",
                table: "ClassSessions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ClassSessionStudents",
                columns: table => new
                {
                    ClassSessionId = table.Column<int>(type: "integer", nullable: false),
                    StudentId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassSessionStudents", x => new { x.ClassSessionId, x.StudentId });
                    table.ForeignKey(
                        name: "FK_ClassSessionStudents_ClassSessions_ClassSessionId",
                        column: x => x.ClassSessionId,
                        principalTable: "ClassSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassSessionStudents_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassSessions_InstructorId",
                table: "ClassSessions",
                column: "InstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassSessionStudents_StudentId",
                table: "ClassSessionStudents",
                column: "StudentId");

            migrationBuilder.AddForeignKey(
                name: "FK_ClassSessions_Users_InstructorId",
                table: "ClassSessions",
                column: "InstructorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClassSessions_Users_InstructorId",
                table: "ClassSessions");

            migrationBuilder.DropTable(
                name: "ClassSessionStudents");

            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_ClassSessions_InstructorId",
                table: "ClassSessions");

            migrationBuilder.DropColumn(
                name: "InstructorId",
                table: "ClassSessions");
        }
    }
}
