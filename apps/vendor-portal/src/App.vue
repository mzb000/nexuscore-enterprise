<script setup lang="ts">
import { ref } from "vue";

interface OrderStats {
  pending: number;
  completed: number;
  revenue: number;
}

const stats = ref<OrderStats>({
  pending: 14,
  completed: 842,
  revenue: 124890.50,
});
</script>

<template>
  <div style="font-family: system-ui, sans-serif; background: #090d16; color: #f8fafc; min-height: 100vh; padding: 2rem;">
    <header style="border-bottom: 1px solid #1e293b; padding-bottom: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="color: #38bdf8; margin: 0; font-size: 1.75rem;">NexusCore Vendor Portal</h1>
        <p style="color: #94a3b8; margin: 0.5rem 0 0;">Vue 3 Composition API &bull; Micro-Frontend Remote Module</p>
      </div>
      <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 600; font-size: 0.875rem;">
        Live Settlement Active
      </div>
    </header>

    <main style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
      <div style="background: #0f172a; border: 1px solid #1e293b; padding: 1.5rem; border-radius: 0.75rem;">
        <span style="color: #94a3b8; font-size: 0.875rem;">Pending Orders</span>
        <h2 style="font-size: 2rem; margin: 0.5rem 0; color: #f59e0b;">{{ stats.pending }}</h2>
      </div>

      <div style="background: #0f172a; border: 1px solid #1e293b; padding: 1.5rem; border-radius: 0.75rem;">
        <span style="color: #94a3b8; font-size: 0.875rem;">Fulfilled Orders</span>
        <h2 style="font-size: 2rem; margin: 0.5rem 0; color: #10b981;">{{ stats.completed }}</h2>
      </div>

      <div style="background: #0f172a; border: 1px solid #1e293b; padding: 1.5rem; border-radius: 0.75rem;">
        <span style="color: #94a3b8; font-size: 0.875rem;">Total Net Revenue</span>
        <h2 style="font-size: 2rem; margin: 0.5rem 0; color: #38bdf8;">${{ stats.revenue.toLocaleString() }}</h2>
      </div>
    </main>
  </div>
</template>
