package com.taskbuks.app.di

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object SupabaseModule {

    @Provides
    @Singleton
    fun provideSupabaseClient(): SupabaseClient {
        return createSupabaseClient(
            supabaseUrl = "https://hhikodbyohpetdiirfkk.supabase.co",
            supabaseKey = "sb_publishable_v0MGgxh8S_7cLwyzL5FbQg_uh7sD0UE"
        ) {
            install(Postgrest)
            install(Auth)
        }
    }
}
