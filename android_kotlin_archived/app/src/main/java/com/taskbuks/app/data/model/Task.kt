package com.taskbuks.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Task(
    val id: String,
    val title: String,
    val description: String?,
    @SerialName("payout_amount") val payoutAmount: Double,
    @SerialName("icon_url") val iconUrl: String?,
    @SerialName("action_url") val actionUrl: String,
    val category: String,
    @SerialName("is_active") val isActive: Boolean
)
