
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { Palette, CircleDot } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const predefinedColors = [
  { name: 'Verde Oliva', value: '#8B9474' },
  { name: 'Laranja Claro', value: '#F5A65B' },
  { name: 'Verde Médio', value: '#6CAE75' },
  { name: 'Verde Pastel', value: '#8BBD8B' },
  { name: 'Verde Amarelado', value: '#C1CC99' },
];

// Novas opções de cores predefinidas para botões
const buttonColors = [
  { name: 'Verde Oliva', value: '#8B9474' },
  { name: 'Laranja Claro', value: '#F5A65B' },
  { name: 'Verde Médio', value: '#6CAE75' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Roxo', value: '#8B5CF6' },
];

// Cores para área principal (main)
const mainColors = [
  { name: 'Cinza Claro', value: '#F3F4F6' },
  { name: 'Branco', value: '#FFFFFF' },
  { name: 'Bege', value: '#F5F5DC' },
  { name: 'Azul Claro', value: '#EFF6FF' },
  { name: 'Cinza Escuro', value: '#1F2937' },
];

export const ThemeCustomizer = () => {
  const { 
    headerColor, setHeaderColor, 
    avatarColor, setAvatarColor, 
    textColor, setTextColor,
    mainColor, setMainColor,
    buttonColor, setButtonColor
  } = useTheme();
  
  const [customHeaderColor, setCustomHeaderColor] = useState(headerColor);
  const [customAvatarColor, setCustomAvatarColor] = useState(avatarColor);
  const [customMainColor, setCustomMainColor] = useState(mainColor);
  const [customButtonColor, setCustomButtonColor] = useState(buttonColor);

  const handleHeaderColorChange = (color: string) => {
    setCustomHeaderColor(color);
    setHeaderColor(color);
  };

  const handleAvatarColorChange = (color: string) => {
    setCustomAvatarColor(color);
    setAvatarColor(color);
  };

  const handleMainColorChange = (color: string) => {
    setCustomMainColor(color);
    setMainColor(color);
  };

  const handleButtonColorChange = (color: string) => {
    setCustomButtonColor(color);
    setButtonColor(color);
  };

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${textColor}`}>
          <Palette className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4 p-2">
          <h4 className="font-medium">Tema</h4>
          
          <Tabs defaultValue="cores" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="cores">Cores</TabsTrigger>
              <TabsTrigger value="avancado">Avançado</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cores" className="space-y-4 mt-4">
              {/* Opções rápidas para cor do texto */}
              <div className="space-y-1.5">
                <Label className="text-sm">Cor do Texto:</Label>
                <div className="flex gap-2 mt-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-black text-white h-8 w-12" 
                    onClick={() => handleTextColorChange('text-white')}
                  >
                    <CircleDot className="h-4 w-4 text-white" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white text-black border h-8 w-12" 
                    onClick={() => handleTextColorChange('text-gray-800')}
                  >
                    <CircleDot className="h-4 w-4 text-black" />
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {/* Cores pré-definidas para os botões */}
              <div className="space-y-1.5">
                <Label className="text-sm">Cor dos Botões:</Label>
                <div className="grid grid-cols-5 gap-1 mt-1">
                  {buttonColors.map((color) => (
                    <button
                      key={color.value}
                      className="w-full h-6 rounded border"
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleButtonColorChange(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Cores pré-definidas para o main */}
              <div className="space-y-1.5">
                <Label className="text-sm">Cor da Área Principal:</Label>
                <div className="grid grid-cols-5 gap-1 mt-1">
                  {mainColors.map((color) => (
                    <button
                      key={color.value}
                      className="w-full h-6 rounded border"
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleMainColorChange(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="avancado" className="space-y-4 mt-4">
              {/* Personalização avançada do header */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm">Cor do Tema:</label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="color" 
                      value={customHeaderColor} 
                      onChange={(e) => handleHeaderColorChange(e.target.value)} 
                      className="w-10 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      type="text" 
                      value={customHeaderColor} 
                      onChange={(e) => handleHeaderColorChange(e.target.value)} 
                      className="w-20 h-8"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-5 gap-1 mt-1">
                  {predefinedColors.map((color) => (
                    <button
                      key={color.value}
                      className="w-full h-6 rounded border"
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleHeaderColorChange(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              {/* Personalização avançada do avatar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm">Cor do Avatar:</label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="color" 
                      value={customAvatarColor} 
                      onChange={(e) => handleAvatarColorChange(e.target.value)} 
                      className="w-10 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      type="text" 
                      value={customAvatarColor} 
                      onChange={(e) => handleAvatarColorChange(e.target.value)} 
                      className="w-20 h-8"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-5 gap-1 mt-1">
                  {predefinedColors.map((color) => (
                    <button
                      key={color.value}
                      className="w-full h-6 rounded border"
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleAvatarColorChange(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              {/* Personalização avançada da área principal */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm">Cor da Área Principal:</label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="color" 
                      value={customMainColor} 
                      onChange={(e) => handleMainColorChange(e.target.value)} 
                      className="w-10 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      type="text" 
                      value={customMainColor} 
                      onChange={(e) => handleMainColorChange(e.target.value)} 
                      className="w-20 h-8"
                    />
                  </div>
                </div>
              </div>
              
              {/* Personalização avançada dos botões */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm">Cor dos Botões:</label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="color" 
                      value={customButtonColor} 
                      onChange={(e) => handleButtonColorChange(e.target.value)} 
                      className="w-10 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      type="text" 
                      value={customButtonColor} 
                      onChange={(e) => handleButtonColorChange(e.target.value)} 
                      className="w-20 h-8"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
};
