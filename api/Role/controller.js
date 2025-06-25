const boom = require("@hapi/boom");
const roleService = require("./service");
const logger = require("../../system/utils/logger");

// Get all roles for the current business
const getAllRoles = async (req) => {
  try {
    const businessId = req.user.businessId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await roleService.getRoles(businessId, page, limit);

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    logger.error("Get all roles error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get roles");
  }
};

// Get role by ID
const getRoleById = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { roleId } = req.params;

    const role = await roleService.getRoleById(roleId, businessId);
    if (!role) {
      throw boom.notFound("Role not found");
    }

    return {
      success: true,
      data: role,
    };
  } catch (error) {
    logger.error("Get role by ID error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get role details");
  }
};

// Create a new role
const createRole = async (req) => {
  try {
    const businessId = req.user.businessId;
    const roleData = req.body;

    // Check if role with same name already exists
    const existingRole = await roleService.getRoleByName(
      roleData.name,
      businessId
    );
    if (existingRole) {
      throw boom.conflict("A role with this name already exists");
    }

    const newRole = await roleService.createRole({
      ...roleData,
      business_id: businessId,
    });

    return {
      success: true,
      message: "Role created successfully",
      data: newRole,
    };
  } catch (error) {
    logger.error("Create role error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to create role");
  }
};

// Update an existing role
const updateRole = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { roleId } = req.params;
    const roleData = req.body;

    // Check if role exists
    const existingRole = await roleService.getRoleById(roleId, businessId);
    if (!existingRole) {
      throw boom.notFound("Role not found");
    }

    // Check if updated name conflicts with another role
    if (roleData.name && roleData.name !== existingRole.name) {
      const roleWithName = await roleService.getRoleByName(
        roleData.name,
        businessId
      );
      if (roleWithName && roleWithName.id !== roleId) {
        throw boom.conflict("A role with this name already exists");
      }
    }

    const updatedRole = await roleService.updateRole(roleId, roleData);

    return {
      success: true,
      message: "Role updated successfully",
      data: updatedRole,
    };
  } catch (error) {
    logger.error("Update role error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update role");
  }
};

// Delete a role
const deleteRole = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { roleId } = req.params;

    // Check if role exists
    const existingRole = await roleService.getRoleById(roleId, businessId);
    if (!existingRole) {
      throw boom.notFound("Role not found");
    }

    // Check if this is a default admin role
    if (existingRole.name === "Admin") {
      throw boom.badRequest("Cannot delete default Admin role");
    }

    // Check if role is assigned to any users
    const assignedUsers = await roleService.getRoleUsers(roleId);
    if (assignedUsers.length > 0) {
      throw boom.badRequest(
        "Cannot delete role that is assigned to users. Remove role from users first."
      );
    }

    await roleService.deleteRole(roleId);

    return {
      success: true,
      message: "Role deleted successfully",
    };
  } catch (error) {
    logger.error("Delete role error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to delete role");
  }
};

// Assign role to user
const assignRoleToUser = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { userId } = req.params;
    const { roleId } = req.body;

    // Check if user exists and belongs to the business
    const user = await roleService.getUserById(userId, businessId);
    if (!user) {
      throw boom.notFound("User not found");
    }

    // Check if role exists and belongs to the business
    const role = await roleService.getRoleById(roleId, businessId);
    if (!role) {
      throw boom.notFound("Role not found");
    }

    // Check if the role is already assigned to the user
    const isAssigned = await roleService.isRoleAssignedToUser(userId, roleId);
    if (isAssigned) {
      throw boom.conflict("This role is already assigned to the user");
    }

    await roleService.assignRoleToUser(userId, roleId);

    return {
      success: true,
      message: "Role assigned to user successfully",
    };
  } catch (error) {
    logger.error("Assign role to user error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to assign role to user");
  }
};

// Remove role from user
const removeRoleFromUser = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { userId, roleId } = req.params;

    // Check if user exists and belongs to the business
    const user = await roleService.getUserById(userId, businessId);
    if (!user) {
      throw boom.notFound("User not found");
    }

    // Check if role exists and belongs to the business
    const role = await roleService.getRoleById(roleId, businessId);
    if (!role) {
      throw boom.notFound("Role not found");
    }

    // Check if role is assigned to user
    const isAssigned = await roleService.isRoleAssignedToUser(userId, roleId);
    if (!isAssigned) {
      throw boom.badRequest("This role is not assigned to the user");
    }

    // Check if this is the user's only role
    const userRoles = await roleService.getUserRoles(userId);
    if (userRoles.length === 1 && userRoles[0].id === roleId) {
      throw boom.badRequest(
        "Cannot remove the only role from user. Assign another role first."
      );
    }

    await roleService.removeRoleFromUser(userId, roleId);

    return {
      success: true,
      message: "Role removed from user successfully",
    };
  } catch (error) {
    logger.error("Remove role from user error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to remove role from user");
  }
};

// Get roles assigned to a user
const getUserRoles = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { userId } = req.params;

    // Check if user exists and belongs to the business
    const user = await roleService.getUserById(userId, businessId);
    if (!user) {
      throw boom.notFound("User not found");
    }

    const roles = await roleService.getUserRoles(userId);

    return {
      success: true,
      data: {
        userId,
        roles,
      },
    };
  } catch (error) {
    logger.error("Get user roles error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get user roles");
  }
};

// Update user roles (batch update)
const updateUserRoles = async (req) => {
  try {
    const businessId = req.user.businessId;
    const { userId } = req.params;
    const { roleIds } = req.body;

    // Check if user exists and belongs to the business
    const user = await roleService.getUserById(userId, businessId);
    if (!user) {
      throw boom.notFound("User not found");
    }

    // Validate all roles exist and belong to the business
    for (const roleId of roleIds) {
      const role = await roleService.getRoleById(roleId, businessId);
      if (!role) {
        throw boom.badRequest(`Role with ID ${roleId} not found`);
      }
    }

    await roleService.updateUserRoles(userId, roleIds);

    return {
      success: true,
      message: "User roles updated successfully",
    };
  } catch (error) {
    logger.error("Update user roles error:", error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update user roles");
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  updateUserRoles,
};
