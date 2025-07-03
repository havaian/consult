// File: frontend/src/components/LanguageSwitcher.vue
<template>
    <div class="language-switcher">
        <select :value="locale" @change="handleLocaleChange"
            class="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="en">English</option>
            <option value="ru">Русский</option>
            <option value="uz">O'zbekcha</option>
        </select>
    </div>
</template>

<script>
import { useI18n } from '@/composables/useI18n';

export default {
    name: 'LanguageSwitcher',
    setup() {
        const { locale, setLocale } = useI18n();

        const handleLocaleChange = (event) => {
            const newLocale = event.target.value;
            setLocale(newLocale);

            // Optional: Reload page to update all content
            // window.location.reload();
        };

        return {
            locale,
            handleLocaleChange
        };
    }
};
</script>