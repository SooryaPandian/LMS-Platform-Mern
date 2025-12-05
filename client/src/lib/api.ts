// API abstraction layer for backend communication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface ApiOptions extends RequestInit {
  params?: Record<string, any>;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      // Clone the response so we can try reading it multiple ways
      const clonedResponse = response.clone();

      try {
        const errorData = await response.json();
        if (errorData && typeof errorData === 'object') {
          errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        }
      } catch (e) {
        // If JSON parsing fails, try to get text from the cloned response
        try {
          const textError = await clonedResponse.text();
          if (textError && textError.trim()) {
            errorMessage = textError;
          }
        } catch (textErr) {
          // Keep default error message
          console.error('Error parsing response:', textErr);
        }
      }

      throw new Error(errorMessage || 'An error occurred');
    }

    return response.json();
  }

  // Generic HTTP methods
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth
  async login(email: string, password: string, role: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  // Batches
  async getBatches(params?: any) {
    return this.request<any[]>('/batches', { params });
  }

  async createBatch(data: any) {
    return this.request<any>('/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBatch(id: string, data: any) {
    return this.request<any>(`/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBatch(id: string) {
    return this.request<void>(`/batches/${id}`, {
      method: 'DELETE',
    });
  }

  // Departments
  async getDepartments(params?: any) {
    return this.request<any[]>('/departments', { params });
  }

  async createDepartment(data: any) {
    return this.request<any>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id: string, data: any) {
    return this.request<any>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(id: string) {
    return this.request<void>(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  // Courses
  async getCourses(params?: any) {
    return this.request<any[]>('/courses', { params });
  }

  async createCourse(data: any) {
    return this.request<any>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourse(id: string, data: any) {
    return this.request<any>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(id: string) {
    return this.request<void>(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // Regulations
  async getRegulations(params?: any) {
    return this.request<any[]>('/regulations', { params });
  }

  async createRegulation(data: any) {
    return this.request<any>('/regulations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRegulation(id: string, data: any) {
    return this.request<any>(`/regulations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRegulation(id: string) {
    return this.request<void>(`/regulations/${id}`, {
      method: 'DELETE',
    });
  }

  // Classes
  async getClasses(params?: any) {
    return this.request<any[]>('/classes', { params });
  }

  async createClass(data: any) {
    return this.request<any>('/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClass(id: string, data: any) {
    return this.request<any>(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClass(id: string) {
    return this.request<void>(`/classes/${id}`, {
      method: 'DELETE',
    });
  }

  // Faculty
  async getFaculty(params?: any) {
    return this.request<any[]>('/faculty', { params });
  }

  async createFaculty(data: any) {
    return this.request<any>('/faculty', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFaculty(id: string, data: any) {
    return this.request<any>(`/faculty/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFaculty(id: string) {
    return this.request<void>(`/faculty/${id}`, {
      method: 'DELETE',
    });
  }

  // Students
  async getStudents() {
    return this.request<any>('/students');
  }

  async getClassStudents(classId: string) {
    return this.request<any>(`/students?classId=${classId}`);
  }

  async createStudent(data: any) {
    return this.request<any>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStudent(id: string, data: any) {
    return this.request<any>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStudent(id: string) {
    return this.request<void>(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkUploadStudents(data: any) {
    return this.request<any>('/students/bulk-upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  // Class additional methods
  async getClassesBySection(params: any) {
    return this.request<any[]>('/classes/by-section', { params });
  }

  async assignFacultyToClass(classId: string, data: any) {
    return this.request<any>(`/classes/${classId}/assign-faculty`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Course Assignment methods
  async getCourseAssignments(params?: any) {
    return this.request<any>('/course-assignments', { params });
  }

  async getCoursesForSemester(regulationId: string, departmentId: string, batchId: string, semesterNumber: number) {
    return this.request<any>('/course-assignments/semester', {
      params: { regulationId, departmentId, batchId, semesterNumber }
    });
  }

  async assignCourseToSemester(data: any) {
    return this.request<any>('/course-assignments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async bulkAssignCourses(data: any) {
    return this.request<any>('/course-assignments/bulk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async removeCourseAssignment(assignmentId: string) {
    return this.request<any>(`/course-assignments/${assignmentId}`, {
      method: 'DELETE'
    });
  }

  // Fees
  async getFees(params?: any) {
    return this.request<any>('/fees', { params });
  }

  async getFeeTemplate(params: any) {
    return this.request<any>('/fees/template', { params });
  }

  async createFee(data: any) {
    return this.request<any>('/fees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkCreateFees(data: any) {
    return this.request<any>('/fees/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createBulkFees(data: any) {
    return this.bulkCreateFees(data);
  }

  async recordFeePayment(feeId: string, data: any) {
    return this.request<any>(`/fees/${feeId}/payment`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStudentFees(studentId: string) {
    return this.request<any>(`/fees/student/${studentId}`, {
      method: 'GET',
    });
  }

  async bulkUploadFees(data: any) {
    return this.request<any>('/fees/bulk-upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async recordPayment(feeId: string, data: any) {
    return this.request<any>(`/fees/${feeId}/payment`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Course Allocations
  async getCourseAllocations(params?: any) {
    return this.request<any>('/course-allocations', { params });
  }

  async getCoursesForSection(classId: string, semester: number) {
    return this.request<any>(`/course-allocations/section/${classId}/semester/${semester}`);
  }

  async assignFacultyToCourse(data: any) {
    return this.request<any>('/course-allocations/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkAssignFaculty(data: any) {
    return this.request<any>('/course-allocations/bulk-assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteCourseAllocation(id: string) {
    return this.request<void>(`/course-allocations/${id}`, {
      method: 'DELETE',
    });
  }

  // Course Materials (Faculty)
  async uploadCourseMaterial(formData: FormData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/course-materials`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData, // Don't set Content-Type, let browser set it with boundary
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  async getCourseMaterials(params?: any) {
    return this.request<any>('/course-materials', { params });
  }

  async getCourseMaterialsByCourse(courseId: string, params?: any) {
    return this.request<any>(`/course-materials/course/${courseId}`, { params });
  }

  async deleteCourseMaterial(id: string) {
    return this.request<void>(`/course-materials/${id}`, {
      method: 'DELETE',
    });
  }

  // Assessments
  async createAssessment(data: any) {
    return this.request<any>('/assessments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAssessments(params?: any) {
    return this.request<any>('/assessments', { params });
  }

  async getAssessment(id: string) {
    return this.request<any>(`/assessments/${id}`);
  }

  async updateAssessmentMarks(id: string, marks: any[]) {
    return this.request<any>(`/assessments/${id}/marks`, {
      method: 'PUT',
      body: JSON.stringify({ marks }),
    });
  }

  async getStudentMarks(studentId: string, params?: any) {
    return this.request<any>(`/assessments/student/${studentId}`, { params });
  }

  async deleteAssessment(id: string) {
    return this.request<void>(`/assessments/${id}`, {
      method: 'DELETE',
    });
  }

  async getStudent(studentId: string) {
    return this.request<any>(`/students/${studentId}`, {
      method: 'GET',
    });
  }

  async getClassStudents(classId: string) {
    return this.request<any>(`/classes/${classId}/students`, {
      method: 'GET',
    });
  }
}

export const api = new ApiClient();
