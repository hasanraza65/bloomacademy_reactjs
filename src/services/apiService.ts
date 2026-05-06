import { LoginResponse } from '../types';
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

  async startClass(): Promise<{ success: boolean; data: any; message?: string }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}classrooms/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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

  async startWhiteboardSession(): Promise<{ uuid: string; roomToken: string }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${BASE_URL}classrooms/start-whiteboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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
  }
};
