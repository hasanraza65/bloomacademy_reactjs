import { LoginResponse, ClassroomData } from '../types';
import { BASE_URL } from '../lib/config';

export const apiService = {
  async login(payload: any): Promise<LoginResponse> {
    const response = await fetch(`${BASE_URL}login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  async signupParent(payload: any): Promise<LoginResponse> {
    const response = await fetch(`${BASE_URL}signup/parent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  },
  
  async sendOtp(email: string) {
  const response = await fetch(`${BASE_URL}parent/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return response.json();
},

async verifyOtp(email: string, otp: string) {
  const response = await fetch(`${BASE_URL}parent/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  return response.json();
},

  async signupTeacher(payload: any): Promise<LoginResponse> {
    const response = await fetch(`${BASE_URL}signup/teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  async startClass(channelName?: string): Promise<{ success: boolean; data: any; message?: string }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}classrooms/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ channel_name: channelName }),
    });
    return response.json();
  },

  async joinClass(channelName?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}classrooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ channel_name: channelName }),
    });
    return response.json();
  },

  async endClass(id: number): Promise<{ success: boolean }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}classrooms/${id}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return response.json();
  },

  async getClassroomMaterials(classroomId: number): Promise<{ success: boolean; data: any[] }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}classrooms/${classroomId}/materials`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return response.json();
  },

  async deleteMaterial(id: number | string): Promise<{ success: boolean; message?: string }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}delete-material/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ _method: 'DELETE' }),
    });
    return response.json();
  },

  async uploadClassroomMaterial(classroomId: number, formData: FormData): Promise<{ success: boolean; data: any }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}classrooms/${classroomId}/materials/upload`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });
    return response.json();
  },

  async activateClassroomMaterial(classroomId: number, materialId: number): Promise<{ success: boolean; data: any }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}classrooms/${classroomId}/materials/${materialId}/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return response.json();
  },

  async startWhiteboardSession(channelName: string): Promise<{ uuid: string; roomToken: string }> {

    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${BASE_URL}classrooms/start-whiteboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },

      body: JSON.stringify({
        channel_name: channelName
      })

    });

    return response.json();
  },

  async deactivateClassroomMaterial(classroomId: number, materialId: number): Promise<{ success: boolean }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}classrooms/${classroomId}/materials/${materialId}/deactivate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return response.json();
  },

  async getAnnotations(pairId: number | string, materialId: number | string, pageNumber?: number): Promise<{ success: boolean; data?: any }> {
    const token = localStorage.getItem('auth_token');
    let url = `${BASE_URL}annotations?pair_id=${pairId}&material_id=${materialId}`;
    if (pageNumber !== undefined) {
      url += `&page_number=${pageNumber}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return response.json();
  },

  async syncAnnotations(payload: any[]): Promise<{ success: boolean }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  async deleteAnnotations(pairId: number | string, materialId: number | string): Promise<{ success: boolean }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}annotations?pair_id=${pairId}&material_id=${materialId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return response.json();
  },

  async getMyClasses(): Promise<ClassroomData[]> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}my-classes`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return response.json();
  },

  async getClassroom(id: number | string): Promise<any> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}classrooms/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return response.json();
  },

  async getCalendar(month?: string | number, year?: string | number): Promise<any> {
    const token = localStorage.getItem('auth_token');
    let url = `${BASE_URL}calendar`;
    if (month !== undefined && year !== undefined) {
      url += `?month=${month}&year=${year}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return response.json();
  },

    async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BASE_URL}forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  async resetPassword(payload: any): Promise<{ success: boolean; message: string; errors?: Record<string, string[]> }> {
    const response = await fetch(`${BASE_URL}reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  async getPriceQuote(id: string | number): Promise<{ success: boolean; data: any; recommended_teachers: any[] }> {
    const response = await fetch(`${BASE_URL}price-quotes/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch quote: ${response.statusText}`);
    }
    return response.json();
  },

  async updatePriceQuoteStatus(
    id: string | number,
    payload: {
      status: 'Approved' | 'Refused';
      vacation_included: number;
      lesson_style: 'Private' | 'Group';
      preferred_teacher_user_id: number | null;
      children_data?: any[];
    }
  ): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(`${BASE_URL}price-quotes/${id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  }
};

