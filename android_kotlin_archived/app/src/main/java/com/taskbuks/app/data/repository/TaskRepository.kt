package com.taskbuks.app.data.repository

import com.taskbuks.app.data.model.Task
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TaskRepository @Inject constructor(
    private val supabase: SupabaseClient
) {
    suspend fun getTasks(): List<Task> {
        return supabase.postgrest["tasks"]
            .select()
            .decodeList<Task>()
    }

    suspend fun getTaskById(taskId: String): Task? {
        return supabase.postgrest["tasks"]
            .select {
                filter {
                    eq("id", taskId)
                }
            }
            .decodeSingleOrNull<Task>()
    }
}
