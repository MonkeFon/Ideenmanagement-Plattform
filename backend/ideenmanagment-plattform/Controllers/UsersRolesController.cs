using IdeaPlatform.Authorization;
using IdeaPlatform.Common.Pagination;
using IdeaPlatform.Common.Responses;
using IdeaPlatform.DTOs;
using IdeaPlatform.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IdeaPlatform.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IUserService _users;
    public UsersController(IUserService users) => _users = users;

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserDetailResponse>>> Me(CancellationToken ct)
        => Ok(ApiResponse<UserDetailResponse>.Ok(await _users.GetCurrentAsync(ct)));

    [HttpPut("me")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> UpdateMe([FromBody] UpdateProfileRequest req, CancellationToken ct)
        => Ok(ApiResponse<UserResponse>.Ok(await _users.UpdateCurrentAsync(req, ct)));

    [HttpGet, HasPermission(Permissions.UsersRead)]
    public async Task<ActionResult<ApiResponse<PagedResult<UserResponse>>>> List([FromQuery] UserFilterQuery query, CancellationToken ct)
        => Ok(ApiResponse<PagedResult<UserResponse>>.Ok(await _users.GetPagedAsync(query, ct)));

    [HttpGet("{id:guid}"), HasPermission(Permissions.UsersRead)]
    public async Task<ActionResult<ApiResponse<UserDetailResponse>>> GetById(Guid id, CancellationToken ct)
        => Ok(ApiResponse<UserDetailResponse>.Ok(await _users.GetByIdAsync(id, ct)));

    [HttpPut("{id:guid}"), HasPermission(Permissions.UsersManage)]
    public async Task<ActionResult<ApiResponse<UserResponse>>> Update(Guid id, [FromBody] UpdateUserRequest req, CancellationToken ct)
        => Ok(ApiResponse<UserResponse>.Ok(await _users.UpdateAsync(id, req, ct)));

    [HttpDelete("{id:guid}"), HasPermission(Permissions.UsersManage)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await _users.DeleteAsync(id, ct); return NoContent(); }

    [HttpPost("{id:guid}/activate"), HasPermission(Permissions.UsersManage)]
    public async Task<ActionResult<ApiResponse<UserResponse>>> Activate(Guid id, CancellationToken ct)
        => Ok(ApiResponse<UserResponse>.Ok(await _users.SetActiveAsync(id, true, ct)));

    [HttpPost("{id:guid}/deactivate"), HasPermission(Permissions.UsersManage)]
    public async Task<ActionResult<ApiResponse<UserResponse>>> Deactivate(Guid id, CancellationToken ct)
        => Ok(ApiResponse<UserResponse>.Ok(await _users.SetActiveAsync(id, false, ct)));

    [HttpPost("{id:guid}/roles"), HasPermission(Permissions.UsersManage)]
    public async Task<ActionResult<ApiResponse<UserResponse>>> AssignRole(Guid id, [FromBody] AssignRoleRequest req, CancellationToken ct)
        => Ok(ApiResponse<UserResponse>.Ok(await _users.AssignRoleAsync(id, req.RoleId, ct)));

    [HttpDelete("{id:guid}/roles/{roleId:guid}"), HasPermission(Permissions.UsersManage)]
    public async Task<IActionResult> RemoveRole(Guid id, Guid roleId, CancellationToken ct)
    { await _users.RemoveRoleAsync(id, roleId, ct); return NoContent(); }
}

[ApiController]
[Route("api/roles")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roles;
    public RolesController(IRoleService roles) => _roles = roles;

    [HttpGet, HasPermission(Permissions.RolesManage)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<RoleResponse>>>> GetAll(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<RoleResponse>>.Ok(await _roles.GetAllAsync(ct)));

    [HttpGet("{id:guid}"), HasPermission(Permissions.RolesManage)]
    public async Task<ActionResult<ApiResponse<RoleResponse>>> Get(Guid id, CancellationToken ct)
        => Ok(ApiResponse<RoleResponse>.Ok(await _roles.GetByIdAsync(id, ct)));

    [HttpPost, HasPermission(Permissions.RolesManage)]
    public async Task<ActionResult<ApiResponse<RoleResponse>>> Create([FromBody] CreateRoleRequest req, CancellationToken ct)
    { var r = await _roles.CreateAsync(req, ct); return Created($"/api/roles/{r.Id}", ApiResponse<RoleResponse>.Ok(r)); }

    [HttpPut("{id:guid}"), HasPermission(Permissions.RolesManage)]
    public async Task<ActionResult<ApiResponse<RoleResponse>>> Update(Guid id, [FromBody] UpdateRoleRequest req, CancellationToken ct)
        => Ok(ApiResponse<RoleResponse>.Ok(await _roles.UpdateAsync(id, req, ct)));

    [HttpDelete("{id:guid}"), HasPermission(Permissions.RolesManage)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await _roles.DeleteAsync(id, ct); return NoContent(); }

    [HttpPost("{id:guid}/permissions"), HasPermission(Permissions.RolesManage)]
    public async Task<ActionResult<ApiResponse<RoleResponse>>> AssignPermission(Guid id, [FromBody] AssignPermissionRequest req, CancellationToken ct)
        => Ok(ApiResponse<RoleResponse>.Ok(await _roles.AssignPermissionAsync(id, req.PermissionId, ct)));

    [HttpDelete("{id:guid}/permissions/{permId:guid}"), HasPermission(Permissions.RolesManage)]
    public async Task<IActionResult> RemovePermission(Guid id, Guid permId, CancellationToken ct)
    { await _roles.RemovePermissionAsync(id, permId, ct); return NoContent(); }

    [HttpGet("permissions"), HasPermission(Permissions.RolesManage)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PermissionResponse>>>> GetPermissions(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<PermissionResponse>>.Ok(await _roles.GetAllPermissionsAsync(ct)));
}


