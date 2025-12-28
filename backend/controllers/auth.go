package controllers

import (
	"time"

	"ai-chat-backend/database"
	"ai-chat-backend/models"
	"ai-chat-backend/utils"
	"github.com/gin-gonic/gin"
)

type AuthController struct{}

// Register 用户注册
func (ac *AuthController) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	// 检查用户是否已存在
	var existingUser models.User
	if err := database.DB.Where("email = ? OR username = ?", req.Email, req.Username).First(&existingUser).Error; err == nil {
		utils.BadRequest(c, "用户名或邮箱已存在")
		return
	}

	// 加密密码
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.InternalServerError(c, "密码加密失败")
		return
	}

	// 创建用户
	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
		Role:     models.RoleFree,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		utils.InternalServerError(c, "创建用户失败")
		return
	}

	utils.SuccessWithMessage(c, "注册成功", user.ToResponse())
}

// Login 用户登录
func (ac *AuthController) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	// 查找用户
	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		utils.Unauthorized(c, "邮箱或密码错误")
		return
	}

	// 验证密码
	if !utils.CheckPassword(req.Password, user.Password) {
		utils.Unauthorized(c, "邮箱或密码错误")
		return
	}

	// 更新最后登录时间
	now := time.Now()
	user.LastLoginAt = &now
	database.DB.Save(&user)

	// 生成Token
	token, err := utils.GenerateToken(user.ID, user.Username, user.Email)
	if err != nil {
		utils.InternalServerError(c, "生成令牌失败")
		return
	}

	utils.Success(c, models.LoginResponse{
		Token: token,
		User:  user,
	})
}

// GetProfile 获取用户信息
func (ac *AuthController) GetProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		utils.NotFound(c, "用户不存在")
		return
	}

	utils.Success(c, user.ToResponse())
}

// UpdateProfile 更新用户信息
func (ac *AuthController) UpdateProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		utils.NotFound(c, "用户不存在")
		return
	}

	var req struct {
		Username  string `json:"username"`
		AvatarURL string `json:"avatar_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误")
		return
	}

	if req.Username != "" {
		user.Username = req.Username
	}
	if req.AvatarURL != "" {
		user.AvatarURL = req.AvatarURL
	}

	if err := database.DB.Save(&user).Error; err != nil {
		utils.InternalServerError(c, "更新用户信息失败")
		return
	}

	utils.Success(c, user.ToResponse())
}

