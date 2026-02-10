package com.taskbuks.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    val email: String,
    @SerialName("full_name") val fullName: String?,
    @SerialName("phone_number") val phoneNumber: String?,
    @SerialName("avatar_url") val avatarUrl: String?,
    @SerialName("referral_code") val referralCode: String?,
    @SerialName("referred_by") val referredBy: String?
)
