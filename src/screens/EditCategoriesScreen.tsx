import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '../components/Card';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';
import { Category } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'EditCategories'>;

export const EditCategoriesScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { type } = route.params;

  const categories = useStore((state) => state.categories);
  const deleteCategory = useStore((state) => state.deleteCategory);
  const addCategory = useStore((state) => state.addCategory);
  const addSubcategory = useStore((state) => state.addSubcategory);
  const deleteSubcategory = useStore((state) => state.deleteSubcategory);
  const settings = useStore((state) => state.settings);

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryNameEn, setNewCategoryNameEn] = useState('');
  const [addingSubcategoryTo, setAddingSubcategoryTo] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) => c.type === type);
  const isExpense = type === 'expense';

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      t('common.delete'),
      `Delete "${settings.language === 'es' ? category.name : category.nameEn}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteCategory(category.id);
          },
        },
      ]
    );
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert(t('common.error'), 'Please enter a name');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCategory({
      name: newCategoryName.trim(),
      nameEn: newCategoryNameEn.trim() || newCategoryName.trim(),
      color: isExpense ? colors.expense : colors.income,
      icon: 'ellipse',
      type,
    });

    setNewCategoryName('');
    setNewCategoryNameEn('');
    setShowAddModal(false);
  };

  const handleAddSubcategory = (categoryId: string) => {
    if (!newCategoryName.trim()) {
      Alert.alert(t('common.error'), 'Please enter a name');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addSubcategory(
      categoryId,
      newCategoryName.trim(),
      newCategoryNameEn.trim() || newCategoryName.trim()
    );

    setNewCategoryName('');
    setNewCategoryNameEn('');
    setAddingSubcategoryTo(null);
  };

  const getCategoryName = (cat: Category) =>
    settings.language === 'es' ? cat.name : cat.nameEn;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isExpense
            ? t('settings.expenseCategories')
            : t('settings.incomeCategories')}
        </Text>
        <Pressable onPress={() => setShowAddModal(true)} style={styles.backButton}>
          <Ionicons name="add" size={28} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {filteredCategories.map((category) => (
          <Card key={category.id} style={styles.categoryCard}>
            <Pressable
              style={styles.categoryHeader}
              onPress={() =>
                setExpandedCategory(
                  expandedCategory === category.id ? null : category.id
                )
              }
            >
              <View style={styles.categoryLeft}>
                <View
                  style={[styles.colorDot, { backgroundColor: category.color }]}
                />
                <Text style={styles.categoryName}>{getCategoryName(category)}</Text>
              </View>
              <View style={styles.categoryRight}>
                <Pressable
                  onPress={() => handleDeleteCategory(category)}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.expense} />
                </Pressable>
                <Ionicons
                  name={
                    expandedCategory === category.id
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>

            {expandedCategory === category.id && (
              <View style={styles.subcategoryList}>
                {category.subcategories.map((sub) => (
                  <View key={sub.id} style={styles.subcategoryRow}>
                    <Text style={styles.subcategoryName}>
                      {settings.language === 'es' ? sub.name : sub.nameEn}
                    </Text>
                    <Pressable
                      onPress={() => deleteSubcategory(category.id, sub.id)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  style={styles.addSubcategoryButton}
                  onPress={() => setAddingSubcategoryTo(category.id)}
                >
                  <Ionicons name="add" size={20} color={colors.primary} />
                  <Text style={styles.addSubcategoryText}>
                    {t('settings.addSubcategory')}
                  </Text>
                </Pressable>
              </View>
            )}
          </Card>
        ))}
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        visible={showAddModal || addingSubcategoryTo !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => {
                setShowAddModal(false);
                setAddingSubcategoryTo(null);
                setNewCategoryName('');
                setNewCategoryNameEn('');
              }}
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Text style={styles.modalTitle}>
              {addingSubcategoryTo
                ? t('settings.addSubcategory')
                : t('settings.addCategory')}
            </Text>
            <Pressable
              onPress={() =>
                addingSubcategoryTo
                  ? handleAddSubcategory(addingSubcategoryTo)
                  : handleAddCategory()
              }
            >
              <Text style={styles.saveText}>{t('common.save')}</Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Name (Spanish)</Text>
            <TextInput
              style={styles.input}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="e.g., Transporte"
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />

            <Text style={styles.inputLabel}>Name (English)</Text>
            <TextInput
              style={styles.input}
              value={newCategoryNameEn}
              onChangeText={setNewCategoryNameEn}
              placeholder="e.g., Transportation"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  categoryCard: {
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  subcategoryList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
  },
  subcategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginLeft: 24,
  },
  subcategoryName: {
    fontSize: 15,
    color: colors.text,
  },
  addSubcategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginLeft: 24,
  },
  addSubcategoryText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  saveText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
