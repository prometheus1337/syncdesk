import {
  Box,
  SimpleGrid,
  Text,
  Card,
  CardBody,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  HStack,
  Switch,
  Icon,
} from '@chakra-ui/react';
import { BsGripVertical } from 'react-icons/bs';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DraggableStateSnapshot, DropResult } from '@hello-pangea/dnd';
import { CSStudent, CSUser } from '../types/cs';

interface CSKanbanViewProps {
  students: CSStudent[];
  csUsers: CSUser[];
  onPriorityChange: (studentId: string, priority: string) => void;
  onResponsibleChange: (studentId: string, csResponsible: string | null) => void;
  onToggleCompleted: (studentId: string) => void;
  onViewNotes: (student: CSStudent) => void;
}

export function CSKanbanView({
  students,
  csUsers,
  onPriorityChange,
  onResponsibleChange,
  onToggleCompleted,
  onViewNotes,
}: CSKanbanViewProps) {
  const columns = {
    alta: students.filter(s => s.priority === 'alta'),
    media: students.filter(s => s.priority === 'media'),
    baixa: students.filter(s => s.priority === 'baixa')
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newPriority = destination.droppableId;
    onPriorityChange(draggableId, newPriority);
  };

  const getColumnColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'red';
      case 'media':
        return 'orange';
      case 'baixa':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getColumnLabel = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'Alta';
      case 'media':
        return 'Média';
      case 'baixa':
        return 'Baixa';
      default:
        return priority;
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <SimpleGrid columns={3} spacing={4}>
        {Object.entries(columns).map(([priority, students]) => (
          <Box key={priority}>
            <HStack mb={4} justify="space-between">
              <Box>
                <Badge
                  colorScheme={getColumnColor(priority)}
                  px={2}
                  py={1}
                  borderRadius="full"
                  fontSize="md"
                >
                  {getColumnLabel(priority)}
                </Badge>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {students.length} {students.length === 1 ? 'Aluno' : 'Alunos'}
                </Text>
              </Box>
            </HStack>
            
            <Droppable droppableId={priority}>
              {(provided: DroppableProvided) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  minH="200px"
                  bg="gray.50"
                  p={4}
                  borderRadius="lg"
                  display="flex"
                  flexDirection="column"
                  gap={4}
                >
                  {students.map((student, index) => (
                    <Draggable 
                      key={student.id} 
                      draggableId={student.id} 
                      index={index}
                    >
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          variant="outline"
                          bg={student.is_completed ? 'green.100' : 'white'}
                          _hover={{
                            bg: student.is_completed ? 'green.200' : 'gray.50'
                          }}
                          transform={snapshot.isDragging ? 'rotate(3deg)' : undefined}
                          boxShadow={snapshot.isDragging ? 'lg' : undefined}
                        >
                          <CardBody>
                            <HStack spacing={2} mb={3} {...provided.dragHandleProps}>
                              <Icon as={BsGripVertical} color="gray.400" />
                              <Text fontWeight="bold">{student.name}</Text>
                            </HStack>
                            <Box pl={6}>
                              <Text fontSize="sm" color="gray.600">{student.email}</Text>
                              <Text fontSize="sm" color="gray.600" mb={2}>{student.phone}</Text>
                              
                              <Menu>
                                <MenuButton as={Button} size="sm" variant="ghost" p={1} mb={2}>
                                  <Badge
                                    colorScheme="purple"
                                    px={2}
                                    py={1}
                                    borderRadius="full"
                                  >
                                    {student.responsible_user?.full_name || 'Sem CS'}
                                  </Badge>
                                </MenuButton>
                                <MenuList minW="200px">
                                  <MenuItem onClick={() => onResponsibleChange(student.id, null)}>
                                    <Badge colorScheme="gray" mr={2}>Sem CS</Badge>
                                  </MenuItem>
                                  {csUsers.map((user) => (
                                    <MenuItem 
                                      key={user.id} 
                                      onClick={() => onResponsibleChange(student.id, user.id)}
                                    >
                                      <Badge colorScheme="purple" mr={2}>{user.full_name}</Badge>
                                    </MenuItem>
                                  ))}
                                </MenuList>
                              </Menu>

                              <HStack justify="space-between" align="center">
                                <HStack>
                                  <Switch
                                    isChecked={student.is_completed}
                                    onChange={() => onToggleCompleted(student.id)}
                                    colorScheme="green"
                                    size="sm"
                                  />
                                  <Text fontSize="sm" color="gray.600">Finalizado</Text>
                                </HStack>
                                <Button
                                  size="sm"
                                  onClick={() => onViewNotes(student)}
                                  bg="#FFDB01"
                                  color="black"
                                  _hover={{ bg: '#E5C501' }}
                                >
                                  Ver feedbacks
                                </Button>
                              </HStack>
                            </Box>
                          </CardBody>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Box>
        ))}
      </SimpleGrid>
    </DragDropContext>
  );
} 