import { IsString, IsArray, IsEnum, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";
import { ERolePermission } from "@roles/entities";

export class CreateRoleDto {
    @Transform(({ value }) => value?.toUpperCase())
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsArray()
    @IsEnum(ERolePermission, { each: true })
    @IsNotEmpty()
    permissions: ERolePermission[];
}
