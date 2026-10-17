"use client"

import { AuthForm } from "@/components/auth/auth-form";
import { useSessionQuery } from "@/store/api/auth-api";
import {  useRouter } from "next/navigation";
import { useEffect } from "react";
export default function LoginPage() { 
    const router = useRouter()
    const {data, isError } = useSessionQuery();
    
    const isAuthenticated = !!data && !isError;

    useEffect(() => {
        if(isAuthenticated){
            router.back();
        }
    },[isAuthenticated, router])

    return <AuthForm mode="login" />; 
}
